const audio = {
    shoot: new Howl({
        src:"./audio/Basic_shoot_noise.wav",
        volume : 0.04
    }),
    damageTaken: new Howl({
        src:"./audio/Damage_taken.wav",
        volume : 0.1
    }),
    explosionAudio: new Howl({
        src:"./audio/Missle_or_rpg_or_something_that_shoots_an_explosive.wav",
        volume : 0.1
    }),
    death: new Howl({
        src:"./audio/Death.wav",
        volume : 0.1
    }),
    powerUpNoise: new Howl({
        src:"./audio/Powerup_noise.wav",
        volume : 0.1
    }), 
    select : new Howl({
        src:"./audio/Select.wav",
        volume : 0.1,
        
    }), 
    backgroundMusic : new Howl({
        src:"./audio/Hyper.wav",
        volume : 0.1,
        loop : true
    }), 
}