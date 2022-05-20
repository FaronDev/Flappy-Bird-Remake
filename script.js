const app = new PIXI.Application({
  resizeTo: window
})
app.view.id = "renderer"

document.body.appendChild(app.view)

const loader = PIXI.Loader.shared
const originalGameSpeed = 5 * innerHeight/1000
const pipeSummonRate = 1.5 //Summon rate of the pipes. Unit:Sec
const pipeSpacing = innerHeight * 1/7 // Space between the pipes
const pipeHeight = 320
const pipeWidth = 52
const bgHeight = 512
const bgWidth = 288
const groundWidth = app.view.width
const groundHeight = app.view.height * (15/100)
const groundY = app.view.height * (85/100)
const scale = {x: (innerHeight/20)/24, y: (innerHeight/20)/24}
const gravity = {x: 0, y: 0.4}
const scaleRatioUI = function(btnWidth){return ((innerHeight > innerWidth ? innerWidth : innerHeight) * (4/10))/btnWidth}

let bird, pipes = [], score = 0, scoreBoard, inGame = false, frameCount = 0, gameSpeed
let btnTextures = {}, messageTextures = {}, btns = [], messages = [], scoreCount = 0, textureType = 0
let bgTextures = [], bg

let x = 0, y = 0
addEventListener('mousemove', (e) => {
  x = e.clientX
  y = e.clientY
})

initSettings()

loader.add("spritesheet", "./assets/spritesheets/spritesheet.json")
  .add("spritesheet2", "./assets/spritesheets/spritesheet2.json")
  .add("spritesheet3", "./assets/spritesheets/spritesheet3.json")
  .add("message", "./assets/imgs/message.png")
  .add("gameover", "./assets/imgs/gameover.png")
  .load(onAssetsLoaded)

function onAssetsLoaded(){
  // BIRD

  let birdTextures = []
  let textureOrder = ['0', '1', '2', '1']
  for (let i = 0; i < 4; i++){ // Loading Bird Textures
    let texture = PIXI.Texture.from(`YBird${textureOrder[i]}.png`)
    birdTextures.push(texture)
  }

  let birdSprite = new PIXI.AnimatedSprite(birdTextures)
  bird = new Bird(birdSprite)                        
  bird.init()  
  bird.objMode = "passive" 

  // PIPES                                     

  let pipeTextures = []
  for (let i = 0; i < 2; i++){ // Loading Pipe Textures
    let texture = PIXI.Texture.from(`Pipe${i}.png`)
    pipeTextures.push(texture)
  }

  // GROUND

  let groundTexture = PIXI.Texture.from("Ground.png")
  let ground = new PIXI.TilingSprite(
    groundTexture,
    groundWidth,
    groundHeight
  )

  ground.x = 0
  ground.y = groundY
  ground.scale.set(scale.x, scale.y)

  // BACKGROUND

  bgTextures[0] = PIXI.Texture.from(`BG0.png`)
  bgTextures[1] = PIXI.Texture.from(`BG1.png`)

  bg = new PIXI.TilingSprite(bgTextures[textureType], innerWidth, innerHeight)
  let scaleRatio = innerHeight * 1.07/bgHeight
  bg.scale.set(scaleRatio, scaleRatio)

  // NUMBERS

  let numTextures = []
  for (let i = 0; i < 10; i++){
    let texture = PIXI.Texture.from(`${i}.png`)
    numTextures.push(texture)
  }

  scoreBoard = new ScoreBoard(numTextures)
  scoreBoard.init()

  // BUTTONS

  let btnNames = ["menu", "start", "share", "play", "pause", "restart"]
  for (let i = 0; i < btnNames.length; i++){
    let texture = PIXI.Texture.from(`${btnNames[i]}.png`)
    btnTextures[btnNames[i]] = texture
  }

  // MESSAGES

  let gameoverMsgTexture = loader.resources.gameover.texture
  messageTextures["gameover"] = gameoverMsgTexture

  let logoTexture = loader.resources.message.texture
  let logoFrame = new PIXI.Rectangle(0, 0, 184, 48)
  logoTexture.frame = logoFrame
  messageTextures["logo"] = logoTexture

  // let instructionsTexture = new PIXI.Texture(loader.resources.message.texture)
  // let instructionsFrame = new PIXI.Rectangle(0, 102, 184, 165)
  // instructionsTexture.frame = instructionsFrame
  // messageTextures["instructions"] = instructionsTexture


  // ADDING EVERYTHING TO STAGE

  app.stage.addChild(bg)
  app.stage.addChild(ground)
  app.stage.addChildAt(bird.obj, 1)

  loadUI()
  app.ticker.add((delta) => {
    frameCount++

    if ((frameCount > pipeSummonRate * 60) && inGame && bird.ready){ // Makes a new pipe obstacle
      frameCount = 0

      let pipeDown = new PIXI.Sprite(pipeTextures[textureType])
      let pipeUp = new PIXI.Sprite(pipeTextures[textureType])
      let obstacle = new PIXI.Container()
      obstacle.addChild(pipeUp)
      obstacle.addChild(pipeDown)

      pipeUp.x = 0
      pipeUp.y = 0
      pipeUp.anchor.set(0.5)
      pipeUp.angle = 180
      pipeDown.x = 0
      pipeDown.y = pipeHeight + pipeSpacing
      pipeDown.anchor.set(0.5)

      let offset = -1*pipeHeight/2 + Math.random()*(innerHeight/2)
      let pipe = new Pipe(obstacle, offset, gameSpeed)
      pipes.push(pipe)
      pipe.init()
      app.stage.addChildAt(pipe.obj, 1)

    }

    if (scoreCount > 10){
      scoreCount = 0
      textureType = textureType == 0 ? 1 : 0
      updateBackground()
    }

    ground.tilePosition.x -= gameSpeed * (1/scale.x)

    for (let i = 0; i < pipes.length; i++){
      pipes[i].update()

      if (pipes[i].x < -1 * pipeSpacing/2){
        pipes[i].obj.destroy()
        pipes.splice(i, 1)
        i--
      }
    }

    scoreBoard.update()
    bird.update()
  })
}

function initSettings(){
  app.stage.interactive = true
  app.stage.hitArea = app.renderer.screen
  app.stage.sortableContainer = true

  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
}

function startGame(){
  bird.obj.play()
  bird.init()
  updateBackground()
  frameCount = 0
  inGame = true
  score = 0
  textureType = 0
  gameSpeed = originalGameSpeed

  pipes.forEach(pipeCls => {
    try {app.stage.removeChild(pipeCls.obj)}
    catch(e){}
  })
  pipes = []

  messages.forEach(msg => {
    try {app.stage.removeChild(msg)}
    catch(e){}
  })

  scoreBoard.init()
  app.stage.addChildAt(scoreBoard.obj, 1)
  bird.objMode = "active"

  btns.forEach(btnCls => {
    try {app.stage.removeChild(btnCls.btn)}
    catch(e){}
  })
}

function endGame(){
  bird.obj.stop()
  gameSpeed = 0
  inGame = false
  //app.stage.removeChild(scoreBoard.obj)
  scoreBoard.obj.y = innerHeight/2


  let gameOverSprite = new PIXI.Sprite(messageTextures.gameover)
  gameOverSprite.anchor.set(0.5)
  gameOverSprite.y = innerHeight/3
  gameOverSprite.x = innerWidth/2
  messages.push(gameOverSprite)

  let restartBtn = new Button(innerWidth/2, innerHeight * 0.7, btnTextures.restart, "restart")
  restartBtn.init()
  restartBtn.btn.x = innerWidth/2
  btns.push(restartBtn)

  let menuBtn = new Button(innerWidth/2, innerHeight * 0.8, btnTextures.menu, "menu")
  menuBtn.init()
  menuBtn.btn.x = innerWidth/2
  btns.push(menuBtn)

  let scaleRatio = innerHeight > innerWidth ? innerWidth : innerHeight
  scaleRatio = (scaleRatio * (8/10))/gameOverSprite.width
  gameOverSprite.scale.set(scaleRatio)

  try {app.stage.addChildAt(gameOverSprite, 4)}
  catch (e){app.stage.addChildAt(gameOverSprite, 3)}
}

function loadUI(){
  bird.init()
  gameSpeed = originalGameSpeed
  app.stage.removeChild(scoreBoard.obj)
  bird.objMode = "passive"

  btns.forEach(btnCls => {
    try {app.stage.removeChild(btnCls.btn)}
    catch(e){}
  })

  messages.forEach(msg => {
    try {app.stage.removeChild(msg)}
    catch(e){}
  })

  pipes.forEach(pipeCls => {
    try {app.stage.removeChild(pipeCls.obj)}
    catch(e){}
  })
  pipes = []

  let flappyBirdLogo = new PIXI.Sprite(messageTextures.logo)
  flappyBirdLogo.anchor.set(0.5)
  flappyBirdLogo.x = innerWidth/2
  flappyBirdLogo.y = innerHeight/3.5
  messages.push(flappyBirdLogo)
  app.stage.addChild(flappyBirdLogo)

  let scaleRatio = innerHeight > innerWidth ? innerWidth : innerHeight
  scaleRatio = (scaleRatio * (8/10))/flappyBirdLogo.width
  flappyBirdLogo.scale.set(scaleRatio)

  let startBtn = new Button(innerWidth/2, innerHeight * 0.8, btnTextures.start, "start")
  startBtn.init()
  startBtn.btn.x = innerWidth/2 //- startBtn.btn.width/2 - ((innerHeight > innerWidth ? innerWidth : innerHeight) - startBtn.btn.width*2)/4

  btns.push(startBtn)
}

function updateBackground(){
  app.stage.removeChild(bg)

  bg = new PIXI.TilingSprite(bgTextures[textureType], innerWidth, innerHeight)
  let scaleRatio = innerHeight * 1.07/bgHeight
  bg.scale.set(scaleRatio, scaleRatio)

  app.stage.addChildAt(bg, 0)
}