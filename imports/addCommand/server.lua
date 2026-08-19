--[[
    https://github.com/overextended/ox_lib

    This file is licensed under LGPL-3.0 or higher <https://www.gnu.org/licenses/lgpl-3.0.en.html>

    Copyright © 2025 Linden <https://github.com/thelindat>
]]

---@class OxCommandParams
---@field name string
---@field help? string
---@field type? 'number' | 'playerId' | 'string' | 'longString'
---@field optional? boolean

---@class OxCommandProperties
---@field help string?
---@field params OxCommandParams[]?
---@field restricted boolean | string | string[]?

---@type OxCommandProperties[]
local registeredCommands = {}
local shouldSendCommands = false

--- GHST ADDITION -- not upstream. Expect a conflict here when rebasing on ox_lib.
---
--- The parameter list as it was *declared*, alongside the chat suggestion built from it.
---
--- `buildSuggestion` is lossy on purpose: it exists to feed a chat autocomplete, so it
--- rewrites every parameter as `{ name, help }`, folds the type into the help text as a
--- `(type: number)` suffix, and drops `optional` entirely. That is fine for a chat box and
--- useless for anything building a form -- ghst_admin's palette turns these declarations into
--- input fields, and it needs the real type to know which field to draw and the real
--- `optional` to know which ones it may leave empty. Recovering the type by parsing the
--- suffix back out works; `optional` is simply gone and no amount of parsing brings it back.
---
--- Deliberately a separate event rather than extra keys on `chat:addSuggestions`. That
--- payload is a contract other chat resources read, and this one has exactly one consumer.
---
--- The deprecated `lib.__addCommand` path is not covered: its parameters arrive as
--- `'name:?type'` strings rather than a table, and nothing on this server uses it.
---@type { name: string, help: string?, params: OxCommandParams[]? }[]
local declaredCommands = {}

SetTimeout(1000, function()
    shouldSendCommands = true
    TriggerClientEvent('chat:addSuggestions', -1, registeredCommands)
    TriggerClientEvent('ox_lib:commandProperties', -1, declaredCommands)
end)

AddEventHandler('playerJoining', function()
    TriggerClientEvent('chat:addSuggestions', source, registeredCommands)
    TriggerClientEvent('ox_lib:commandProperties', source, declaredCommands)
end)

--- GHST ADDITION -- not upstream. Expect a conflict here when rebasing on ox_lib.
---
--- Let a client *ask* for the command lists instead of only ever being pushed them.
---
--- Upstream sends them at exactly two moments: once a second after the registering resource
--- starts, and once per `playerJoining`. Both are fire-and-forget, and both miss:
---
---   * The boot broadcast goes to `-1` one second after the resource starts, which during server
---     startup is nobody -- there are no clients connected yet.
---   * `playerJoining` fires while the player is still connecting, before their client-side
---     resources have started, so the handler that would catch it does not exist yet.
---   * Nothing re-sends when a *consumer* restarts. `sync.sh -e` restarts ghst_admin on every file
---     save, and its client comes back with an empty parameter table and no way to refill it.
---
--- The symptom was a palette that ran commands with no arguments: with no declared params, every
--- row looked like a command that takes none, so `/time` ran bare and Renewed-Weathersync rejected
--- it with "received an invalid number for argument 1 (hour), received 'nil'".
---
--- This module is loaded per consuming resource -- ox_lib's loader `load()`s the chunk into
--- whichever resource indexed `lib.addCommand`, so `declaredCommands` above holds only *that*
--- resource's commands. Every consumer therefore registers this handler and every consumer answers
--- with its own slice, which is what makes one request from one client rebuild the whole list.
local nextRequest = {}

RegisterNetEvent('ox_lib:requestCommandProperties', function()
    local src = source

    -- Nothing registered here, nothing to say. Most resources that pull in ox_lib never call
    -- addCommand at all, and a reply carrying two empty tables is still a round trip per resource
    -- per request.
    if #registeredCommands == 0 then return end

    -- Per-source floor. The reply is a broadcast of every command this resource registered, and
    -- the event is reachable by any client -- so without this it is an amplification primitive:
    -- one cheap trigger per client, answered by every addCommand consumer on the server.
    local now = GetGameTimer()
    if (nextRequest[src] or 0) > now then return end
    nextRequest[src] = now + 5000

    TriggerClientEvent('chat:addSuggestions', src, registeredCommands)
    TriggerClientEvent('ox_lib:commandProperties', src, declaredCommands)
end)

---@param source number
---@param args table
---@param raw string
---@param params OxCommandParams[]?
---@return table?
local function parseArguments(source, args, raw, params)
    if not params then return args end

    local paramsNum = #params
    for i = 1, paramsNum do
        local arg, param = args[i], params[i]
        local value

        if param.type == 'number' then
            value = tonumber(arg)
        elseif param.type == 'string' then
            value = not tonumber(arg) and arg
        elseif param.type == 'playerId' then
            value = arg == 'me' and source or tonumber(arg)

            if not value or not DoesPlayerExist(value--[[@as string]]) then
                value = false
            end
        elseif param.type == 'longString' and i == paramsNum then
            if arg then
                local start = raw:find(arg, 1, true)
                value = start and raw:sub(start)
            else
                value = nil
            end
        else
            value = arg
        end

        if not value and (not param.optional or param.optional and arg) then
            return Citizen.Trace(("^1command '%s' received an invalid %s for argument %s (%s), received '%s'^0\n"):format(string.strsplit(' ', raw) or raw, param.type, i, param.name, arg))
        end

        arg = value

        args[param.name] = arg
        args[i] = nil
    end

    return args
end

---@param commandName string
---@param properties OxCommandProperties
---@return OxCommandProperties
local function buildSuggestion(commandName, properties)
    local hints

    if properties.params then
        hints = {}

        for i = 1, #properties.params do
            local param = properties.params[i]
            hints[i] = {
                name = param.name,
                help = param.type
                    and (param.help and ('%s (type: %s)'):format(param.help, param.type) or ('(type: %s)'):format(param.type))
                    or param.help,
            }
        end
    end

    return {
        name = ('/%s'):format(commandName),
        help = properties.help,
        params = hints,
    }
end

---@param commandName string | string[]
---@param properties OxCommandProperties | false
---@param cb fun(source: number, args: table, raw: string)
---@param ... any
function lib.addCommand(commandName, properties, cb, ...)
    -- Try to handle backwards-compatibility with the old addCommand syntax (prior to v3.0)
    local restricted, params

    if properties then
        if ... or table.type(properties) ~= 'hash' then
            local _commandName = type(properties) == 'table' and properties[1] or properties
            local info = debug.getinfo(2, 'Sl')

            warn(("command '%s' is using deprecated syntax for lib.addCommand\nupdate the command or use lib.__addCommand to ignore this warning\n> source ^0(^5%s^0:%d)"):format(_commandName, info.short_src, info.currentline))
            ---@diagnostic disable-next-line: deprecated
            return lib.__addCommand(commandName, properties, cb, ...)
        end

        restricted = properties.restricted
        params = properties.params
    end

    local commands = type(commandName) ~= 'table' and { commandName } or commandName
    local numCommands = #commands
    local totalCommands = #registeredCommands

    local function commandHandler(source, args, raw)
        args = parseArguments(source, args, raw, params)

        if not args then return end

        local success, resp = pcall(cb, source, args, raw)

        if not success then
            Citizen.Trace(("^1command '%s' failed to execute!\n%s"):format(string.strsplit(' ', raw) or raw, resp))
        end
    end

    for i = 1, numCommands do
        totalCommands += 1
        commandName = commands[i]

        RegisterCommand(commandName, commandHandler, restricted and true)

        if restricted then
            local ace = ('command.%s'):format(commandName)
            local restrictedType = type(restricted)

            if restrictedType == 'string' and not IsPrincipalAceAllowed(restricted, ace) then
                lib.addAce(restricted, ace)
            elseif restrictedType == 'table' then
                for j = 1, #restricted do
                    if not IsPrincipalAceAllowed(restricted[j], ace) then
                        lib.addAce(restricted[j], ace)
                    end
                end
            end
        end

        if properties then
            local suggestion = buildSuggestion(commandName, properties)
            registeredCommands[totalCommands] = suggestion

            -- GHST ADDITION -- see declaredCommands above.
            local declared = {
                name = commandName,
                help = properties.help,
                params = properties.params,
            }
            declaredCommands[totalCommands] = declared

            if shouldSendCommands then
                TriggerClientEvent('chat:addSuggestions', -1, suggestion)
                -- Wrapped in a table so the late-registration payload is the same shape as
                -- the boot one. ox_lib sends a bare object on `chat:addSuggestions` here and
                -- every consumer has to special-case it; there is no reason to repeat that.
                TriggerClientEvent('ox_lib:commandProperties', -1, { declared })
            end
        end
    end
end

return lib.addCommand
