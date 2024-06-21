/**
 * canvas configuration
 */
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight

const centerX = canvas.width / 2
const centerY = canvas.height / 2

const scoreEl = document.querySelector('#scoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modalEL = document.querySelector('#modalEl')
const modalScoreEl = document.querySelector('#modalScoreEl')

/**
 * game objects
 */
class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius,
            0, Math.PI * 2, false
        );
        c.fillStyle = this.color
        c.fill()
    }
}

const PROJ_VELOCITY = 10
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius,
            0, Math.PI * 2, false
        );
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x * PROJ_VELOCITY
        this.y = this.y + this.velocity.y * PROJ_VELOCITY
    }
}

const ENEM_VELOCITY = 5
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius,
            0, Math.PI * 2, false
        );
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x * ENEM_VELOCITY
        this.y = this.y + this.velocity.y * ENEM_VELOCITY
    }
}

const friction = 0.99
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius,
            0, Math.PI * 2, false
        );
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }
}

/**
 * game action
 */
let player
let projectiles
let enemies
let particles

function init() {
    player = new Player(centerX, centerY, 30, 'white')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreEl.innerHTML = score
    modalScoreEl.innerHTML = score
}

const ENEM_PER_SECONDS = 10
const SPAWN_TIMEOUT = 1000 / ENEM_PER_SECONDS
let intervalId


function spawnEnemies() {
    intervalId = setInterval(() => {
        let color = `hsl(${Math.random() * 360}, 50%, 50%`
        let radius = Math.random() * (40 - 15) + 15
        let x
        let y

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ?
                0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ?
                0 - radius : canvas.height + radius
        }
        let angle = Math.atan2(
            centerY - y,
            centerX - x
        )
        let velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius,
            color, velocity))
    }, SPAWN_TIMEOUT)
    clearInterval()
}

let animationId
let score

function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.12)'
    c.fillRect(0, 0, canvas.width, canvas.height)

    // particles update
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })

    // projectiles update
    projectiles.forEach((projectile, index) => {
        projectile.update()

        /**
         * remove from edges of the screen or
         */
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0);
        }
    })

    /* ================================================ */

    // enemies update
    enemies.forEach((enemy, index) => {
        enemy.update()

        // colision with player
        const dist = Math.hypot(player.x - enemy.x,
                player.y - enemy.y)
            // dist - enemy.radius < player.radius
        if (dist - enemy.radius - player.radius < 1) {
            setTimeout(() => {
                // end game
                cancelAnimationFrame(animationId)
                modalEL.style.display = 'flex'
                modalScoreEl.innerHTML = score
                clearInterval(intervalId)
            }, 0);
        }

        // colision with a projectile
        projectiles.forEach(
            (projectile, projectileindex) => {
                const dist = Math.hypot(projectile.x - enemy.x,
                    projectile.y - enemy.y)

                // when projectiles touch enemy
                if (dist - enemy.radius - projectile.radius < 1) {

                    // create explosions
                    for (let i = 0; i < enemy.radius * 2; i++) {
                        particles.push(new Particle(
                            projectile.x, projectile.y,
                            Math.random() * 2 + 1,
                            enemy.color, {
                                x: (Math.random() - 0.5) *
                                    (Math.random() * 6),
                                y: (Math.random() - 0.5) *
                                    (Math.random() * 6)
                            }
                        ))
                    }

                    if (enemy.radius - 10 > 20) {
                        // increase our score
                        score += 100
                        scoreEl.innerHTML = score

                        gsap.to(enemy, {
                            radius: enemy.radius - 15
                        })
                        setTimeout(() => {
                            projectiles.splice(projectileindex, 1)
                        }, 0);

                    } else {
                        setTimeout(() => {
                            // kill enemy
                            score += 250
                            scoreEl.innerHTML = score
                            enemies.splice(index, 1)
                            projectiles.splice(projectileindex, 1)
                        }, 0);
                    }
                }
            })
    })

    player.draw()
}

/**
 * controler
 */
addEventListener("mousemove", (event) => {
    const angle = Math.atan2(
        event.clientY - centerY,
        event.clientX - centerX
    )
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
    projectiles.push(new Projectile(
        centerX, centerY, 5, 'white', velocity
    ))
})

startGameBtn.addEventListener('click', () => {
    modalEL.style.display = 'none'
    init()
    animate()
    spawnEnemies()
})

/**
 * start gameloop
 */