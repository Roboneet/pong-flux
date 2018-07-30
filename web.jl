using WebIO, JSExpr
using Blink

# Blink.AtomShell.install()

include("./env-config.jl")

mutable struct WebEnv
    window
    scope
    reset
    state
    action
    result
    reward
    done

    function WebEnv(test=true, files=["./lib/components.js", "./lib/style.css"])
        w = Blink.Window(Dict(:show => test))
        if (test) opentools(w) end

        s = Scope(imports=files)
        s = s(
            dom"div.demo_wrapper"(
                dom"div.board"(
                    dom"div#playground"()
                )
            ))
        state_box = Channel{Array{Any,1}}(1)
        state_obs = Observable(s, "get_state", [])
        action = Observable(s, "action", Dict{String,Any}())
        result_obs = Observable(s, "result", Dict{Any,Any}())
        result_box = Channel{Dict}(1)

        onimport(s, JSExpr.@js () -> begin
            __init__(window);
            $state_obs[] = env.state()

            function setResult(res)
                $result_obs[] = res;
            end
            window.setResult = setResult
        end)

        on(state_obs) do s
            put!(state_box, s)
        end
        on(result_obs) do r
            put!(result_box, r)
        end
        onjs(action, JSExpr.@js x -> begin
            play(x)
        end)
        Blink.body!(w, s)
        state = take!(state_box)
        new(w, s, false, state, action, result_box, 0, false)
    end

    WebEnv(s::AbstractString, test=true) = WebEnv(test, env_config[s])
end

function reset!(env::WebEnv)
    env.reset = true
end

state(env::WebEnv) = env.state

function step!(f, env::WebEnv, s, a)
    play(env, a)
    return f(env.reward, env.state)
end

function play(env::WebEnv, a)
    env.action[] = Dict("action"=>a, "reset"=>env.reset)
    res = take!(env.result)
    env.state = res["state"]
    env.reward = res["reward"]
    env.done = res["done"]
    env.reset = false
end

Base.done(env::WebEnv) = env.done
