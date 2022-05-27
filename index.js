const canvas = document.querySelector("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
const c = canvas.getContext('2d');
const gameScore = document.querySelector("#gameScore");
const gameOverDisplay = document.querySelector("#gameOverDisplay");
const scoreDisplay = document.querySelector("#scoreDisplay");
const resetBtn = document.querySelector("#resetBtn");
const startBtn = document.querySelector("#startBtn");
const startGame = document.querySelector("#startGame");
const volumeBtn = document.querySelector("#volumeUp");
const volumeOff = document.querySelector("#volumeDown");


let player;
let projectiles = [];
let enemies = [];
let particles = [];
let animationFrame;
let score = 0;
let intervalId;
let powerUps = [];
let frame = 0;
let backgroundParticles = [];
let game = {
    active : false
}

function restartGame(){
    const x = canvas.width/2;
    const y = canvas.height/2;
    player = new Player(x , y , 10, " white");
    projectiles = [];
    enemies = [];
    particles = []; 
    powerUps = [];
    backgroundParticles = [];
    game = {
        active : true
    }

    const spacing  = 30;

    for(let x = 0 ; x < canvas.width + spacing ; x += spacing){
        for(let y = 0 ; y < canvas.height + spacing ; y += spacing){
        backgroundParticles.push(new BackgroundParticle({position :
            {
                x,
                y
            },
                radius : 3,
                color : "blue"}))
            }
    }
    animationFrame = 0;
    score = 0;
    gameScore.innerHTML = 0;
    frame = 0;
}


function spawnEnemies(){
    intervalId = setInterval(() => {
        const radius = Math.random() * (30 - 8) + 8;
        let x;
        let y;
        if(Math.random() < 0.5){
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random()*canvas.height;
        }
        else{
            x = Math.random()*canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360} ,50% , 50%)`;
        const angle = Math.atan2(canvas.height / 2 - y , canvas.width / 2 - x )
        const velocity = 
        {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x , y , radius , color, velocity))
    } , 1000)    
}

function createScoreLabel({position, score}){
    const scoreLabel = document.createElement("label");
    scoreLabel.innerHTML = score;
    scoreLabel.style.color = "white";
    scoreLabel.style.fontFamily = "VT323";
    scoreLabel.style.position = "absolute";
    scoreLabel.style.left = position.x + "px";
    scoreLabel.style.top = position.y + "px";
    scoreLabel.style.userSelect = "none";
    scoreLabel.style.pointerEvents = "none";
    document.body.appendChild(scoreLabel);

    gsap.to(scoreLabel , {
        opacity:0,
        y: -30,
        duration : 0.75,
        onComplete: ()=>{
            scoreLabel.parentNode.removeChild(scoreLabel);   
        }
    })
}

function animate(){
    animationFrame = requestAnimationFrame(animate);
    c.fillStyle = "rgba(0 , 0 , 0 , 0.1)"
    c.fillRect(0, 0 , canvas.width , canvas.height);
    frame++;
    backgroundParticles.forEach((backgroundParticle) => {
        backgroundParticle.draw();
        const dist = Math.hypot(player.x - backgroundParticle.position.x , player.y - backgroundParticle.position.y);
        if(dist <= 100){
            backgroundParticle.alpha = 0;
            if(dist > 70){
                backgroundParticle.alpha = 0.5;
            }
        }
        else if (dist > 100 && backgroundParticle.alpha < 0.1){
            backgroundParticle.alpha += 0.01;
        }
        else if (dist > 100 && backgroundParticle.alpha > 0.1){
            backgroundParticle.alpha -= 0.01;
        }
    });
    player.update();

    for(let i = powerUps.length - 1 ; i >= 0 ; i--){
        const powerUp = powerUps[i];    
        if (powerUp.position.x > canvas.width){
            powerUps.splice(i,1)
        }
        else
        powerUp.update();
        const dist = Math.hypot(player.x - powerUp.position.x , player.y - powerUp.position.y);
        //gain powerUP
        if(dist < powerUp.image.height / 2 + player.radius){
            powerUps.splice(i , 1);
            player.powerUp = "MachineGun";
            player.color = "yellow";
            audio.powerUpNoise.play();
            setTimeout(() => {
                player.powerUp = null;
                player.color = "white";
                player.radius = 10;
            }, 5000)
        }
    }
    // machine gun animation code
    if(player.powerUp === "MachineGun"){
        const angle = Math.atan2(mouse.position.y - player.y, mouse.position.x - player.x)
        const velocity = 
        {
            x: Math.cos(angle) * 6,
            y: Math.sin(angle) * 6
        }
        if(frame % 2 === 0){
            projectiles.push(new Projectile(player.x , player.y , 5 , "yellow" , velocity));
        }
        if(frame % 6 === 0){
            audio.shoot.play();
        }
    }

    for(let index = particles.length - 1 ; index >= 0 ; index--){
        const particle = particles[index];
        if(particle.alpha < 0){
            particles.splice(index , 1)
        }
        else{
            particle.update();
        }
    }

    for(let index = projectiles.length - 1 ; index >= 0 ; index--){
        const projectile = projectiles[index];
        projectile.update();
        //remove bullets from screen edge
        if(
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
            ) {
                projectiles.splice(index , 1);    
        }
    }

    for(let index = enemies.length - 1 ; index >= 0 ; index--){
        const enemy = enemies[index];
        enemy.update()
        const dist = Math.hypot(player.x - enemy.x , player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1)
        {
            audio.death.play();
            game.active = false;
            cancelAnimationFrame(animationFrame);
            clearInterval(intervalId);
            clearInterval(spawnPowerUpsId);
            audio.backgroundMusic.pause();
            gameOverDisplay.style.display = "block";
            gsap.fromTo("#gameOverDisplay" , 
            {
                scale : 0.8 ,
                opacity : 0
            },
            {
                scale : 1 ,
                opacity : 1,
                ease: "expo"
            })
            scoreDisplay.innerHTML = score;
        }

        for(let projectileIndex = projectiles.length - 1 ; projectileIndex >= 0 ; projectileIndex--){
            const projectile = projectiles[projectileIndex];
            const dist = Math.hypot(projectile.x - enemy.x , projectile.y - enemy.y);
            //collision detects
            if (dist - enemy.radius - projectile.radius < 1)
            {
                //create particle
                for(let i = 0 ; i < enemy.radius * 3 ; i++){
                    particles.push(
                        new Particle (projectile.x, projectile.y , Math.random() * 2.2 , enemy.color, 
                    {x: (Math.random() - 0.5) * (Math.random() * 8) , y: (Math.random() - 0.5) * (Math.random() * 8)}));
                }
                //this is where we shrink our enemies
                if(enemy.radius - 10 > 5){
                    score += 100;
                    gameScore.innerHTML = score;
                    gsap.to(enemy , {
                        radius: enemy.radius - 10
                    })
                        projectiles.splice(projectileIndex , 1);    
                        createScoreLabel({position: {
                            x: projectile.x,
                            y: projectile.y
                        },score: 100
                    });
                    audio.damageTaken.play();
                }
                //remove enemy
                else{
                    score += 200;
                    gameScore.innerHTML = score;
                    createScoreLabel({position: {
                        x: projectile.x,
                        y: projectile.y
                    },score: 200});
                    backgroundParticles.forEach(((backgroundParticle) =>{
                        gsap.set(backgroundParticle, {
                            color: "white",
                            alpha: 1
                        })
                        gsap.to(backgroundParticle , {
                            color : enemy.color,
                            alpha: 0.1
                        })
                        // backgroundParticle.color = enemy.color;
                    }))
                    enemies.splice(index , 1);
                    projectiles.splice(projectileIndex , 1);    
                    audio.explosionAudio.play();
            }        
            }
        }
}
}

function spawnPowerUps(){
    spawnPowerUpsId = setInterval(() =>{
        powerUps.push(new PowerUp({
            position: {
                x: -30,
                y: Math.random() * canvas.height
           },
            velocity: {
                x: Math.random() + 2 ,
                y:0
            }
        }))
    }, 10000)
}

let audioInitialized = false;

function shoot({x , y}){
    if (game.active){
        const angle = Math.atan2(y - player.y, x - player.x)
        const velocity = 
        {
         x: Math.cos(angle) * 6,
         y: Math.sin(angle) * 6
        }
        projectiles.push(new Projectile(player.x , player.y , 5 , "white" , velocity))
        audio.shoot.play();
    }
}

addEventListener("click" , (event)=>{

    if(!audio.backgroundMusic.playing() && audioInitialized === false){
        audio.backgroundMusic.play();
        audioInitialized = true;
    }
    shoot({x : event.clientX , y : event.clientY});
});

resetBtn.addEventListener("click" , ()=>{
    audio.select.play();
    restartGame();
    animate();
    spawnEnemies();
    spawnPowerUps();
    audio.backgroundMusic.play();
    gsap.to("#gameOverDisplay" , {
        opacity : 0,
        scale : 0.8,
        duration : 0.2,
        ease : "expo.in",
        onComplete: ()=> {
            gameOverDisplay.style.display = "none"
        }
    })
    //gameOverDisplay.style.display = "none";
})

addEventListener("touchstart" , (event) => {
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;

    mouse.position.x = event.touches[0].clientX;
    mouse.position.y = event.touches[0].clientY;

    shoot({x , y});
})

const mouse = {
    position :{
        x: 0,
        y: 0
    }
}
addEventListener("mousemove" , (event)=>{
    mouse.position.x = event.clientX;
    mouse.position.y = event.clientY;
})

addEventListener("touchmove" , (event)=>{
    mouse.position.x = event.touches[0].clientX;
    mouse.position.y = event.touches[0].clientY;
})

volumeBtn.addEventListener("click" , ()=>{
    audio.backgroundMusic.pause();
    volumeOff.style.display = "block";
    volumeBtn.style.display = "none";
    for(let key in audio){
        audio[key].mute(true);
    }
})

volumeOff.addEventListener("click" , ()=>{
    if(audioInitialized === true){
        audio.backgroundMusic.play();
    }
    volumeOff.style.display = "none";
    volumeBtn.style.display = "block";
    for(let key in audio){
        audio[key].mute(false);
    }
})

startBtn.addEventListener("click" , ()=>{
    audio.select.play();
    restartGame();
    animate();
    spawnEnemies();
    spawnPowerUps();
    gsap.to("#startGame" , {
        opacity : 0,
        scale : 0.8,
        duration : 0.2,
        ease : "expo.in",
        onComplete: ()=> {
            startGame.style.display = "none"
        }
    })
})

window.addEventListener("resize" , () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    restartGame();
})

document.addEventListener("visibilitychange", ()=>{
    if(document.hidden){
        //inactive
        //clearIntervals
        clearInterval(intervalId);
        clearInterval(spawnPowerUpsId);
    }
    else{
        //spawnEnemies
        spawnEnemies();
        //spawnPowerUps
        spawnPowerUps();
    }
})

// moving my player
addEventListener("keydown" , (event)=>{
    switch(event.code){
        //w
        case "KeyW":
            player.velocity.y -= 1;
            break;
        //a
        case "KeyA":
            player.velocity.x -= 1;
            break;
        //s
        case "KeyS":
            player.velocity.y += 1;
            break;
        //d
        case "KeyD":
            player.velocity.x += 1;
            break;
    }
})