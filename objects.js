let range = 0, rangeAdder = 0.05

class Bird {
  constructor(obj, objMode="active"){
    this.x = (app.view.width)/2
    this.y = (app.view.height)/2
    this.angle = -20
    this.vel = {x: 0, y: -12}
    this.collisionMinDistance = 12 * scale.x // A Box collision shape
    this.gravity = {x: gravity.x, y: gravity.y * scale.y}
    this.obj = obj
    this.objMode = objMode
    this.ready = false

    this.passiveAnimSpeed = 0.17
    this.activeAnimSpeed = 0.27
  }

  init(){
    this.x = (app.view.width)/2
    this.y = (app.view.height)/2
    this.obj.anchor.set(0.5)
    this.obj.scale.set(scale.x, scale.y)
    this.updateObj()

    app.stage.on("pointerdown", () => {
      if (inGame && this.ready){
        this.vel.y = -1 * pipeSpacing/10
      }
      if (this.ready == false){
        this.ready = true
      }
    })
    
    this.obj.animationSpeed = this.activeAnimSpeed
    this.obj.play()
  }

  collided(){
    if (this.y + this.collisionMinDistance > groundY){
      this.y = groundY - this.collisionMinDistance
      endGame()
    } else if (this.y - this.collisionMinDistance < 0){
      endGame()
    }

    // Checks pipe collisions (Too hard to understand but works!) 
    pipes.forEach((obstacle) => {
      // Getting pipe coordinates (of center)
      let pipe1 = {x: obstacle.obj.children[0].transform.worldTransform.tx, y: obstacle.obj.children[0].transform.worldTransform.ty}
      let pipe2 = {x: obstacle.obj.children[1].transform.worldTransform.tx, y: obstacle.obj.children[1].transform.worldTransform.ty}

      if ((this.x + this.collisionMinDistance > pipe1.x - (pipeWidth * (scale.x + (scale.x * 0.2)))/2) && (this.x - this.collisionMinDistance < pipe1.x + (pipeWidth * (scale.x + (scale.x * 0.2)))/2)){ // If going in between 2 pipes
        if ((this.y + this.collisionMinDistance > pipe2.y - (pipeHeight * scale.y)/2) || (this.y - this.collisionMinDistance < pipe1.y + (pipeHeight * scale.y)/2)){ // If collided with pipe on the y axis
          endGame()
        }
      }

    })

  }
  
  update(){
    if (this.objMode == "active"){
      this.obj.animationSpeed = this.activeAnimSpeed
    } else if (this.objMode == "passive"){
      this.obj.animationSpeed = this.passiveAnimSpeed
    }

    if (this.objMode == "active" && this.ready == true){
      this.vel.x += this.gravity.x
      this.vel.y += this.gravity.y
      
      this.x += this.vel.x
      this.y += this.vel.y

      let angleStart = -20,
        angleEnd = 90,
        ySpeedStart = 20,
        ySpeedEnd = 25

      this.angle = angleStart + (((angleEnd - angleStart)/ySpeedEnd) * this.vel.y)
      if (this.angle > angleEnd){
        this.angle = angleEnd
      } else if (this.angle < angleStart){
        this.angle = angleStart
      }

      this.collided()

    } else if (this.objMode == "passive"){
      this.angle = 0

      if (range < -1 || range > 1){
        rangeAdder *= -1
      }

      range += rangeAdder
      this.y += (Math.cos(Math.PI * range)*2)
    }

    
    this.updateObj()
  }
  
  updateObj(){
    this.obj.x = this.x
    this.obj.y = this.y
    this.obj.angle = this.angle
  }
}


class Pipe {
  constructor(obj, yOffset, speed){
    this.x = app.view.width + pipeWidth + 10
    this.y = 0 - pipeSpacing/2
    this.yOffset = yOffset
    this.obj = obj
  }

  init(){
    this.obj.x = this.x
    this.y += this.yOffset
    this.obj.y = this.y
    this.obj.scale.set(scale.x + (scale.x * 0.2), scale.y)
  }

  update(){
    this.x += gameSpeed * -1

    this.checkIfScored()
    this.updateObj()
  }

  updateObj(){
    this.obj.x = this.x
    this.obj.y = this.y
  }

  checkIfScored(){
    if (this.x < bird.x){
      score++
      scoreCount++
      this.checkIfScored = () => {}
    }
  }
}


class ScoreBoard {
  constructor(numberTextures){
    this.x = (app.view.width)/2
    this.y = (app.view.height)/10
    this.numberTextures = numberTextures
    this.previous_score = score
    this.obj = new PIXI.Container()
  }

  init(){
    score = 0
    this.x = (app.view.width)/2
    this.y = (app.view.height)/10
    this.updateBoard()
  }

  update(){
    if (this.previous_score != score){
      this.previous_score = score
      this.updateBoard()
    }
  }

  updateBoard(){
    this.obj.children = []

    let localScore = score.toString()
    let spacing = 0
    let scaleRatio = ((innerHeight > innerWidth ? innerWidth : innerHeight) * (1/10))/24
    scaleRatio = scaleRatio > 2 ? 2 : scaleRatio
    for (let i = 0; i < localScore.length; i++){
      let digit = Number(localScore[i])
      if (i > 0) { 
        spacing += ((Number(localScore[i-1]) == 1) ? 16 : 24)
      }

      let texture = this.numberTextures[digit] // If index is 0, the texture at that index is also 0
      let sprite = new PIXI.Sprite(texture)
      sprite.scale.set(scaleRatio, scaleRatio)

      sprite.x = spacing * scaleRatio
      this.obj.addChild(sprite)
    }

    this.obj.x = this.x - this.obj.width/2
    this.obj.y = this.y
  }
}

class Button {
  constructor(x, y, texture, type){
    this.x = x
    this.y = y
    this.btn = new PIXI.Sprite(texture)
    this.type = type
  }

  command(type){

    if (type == "start" || type == "restart"){
      startGame()
    } else if (type == "menu"){
      loadUI()
    } else if (type == "share"){
      copyToClipboard()
    } else if (type == "play"){
      app.start()
    } else if (type == "pause"){
      app.stop()
    } 
  }

  init(){

    this.btn.x = this.x
    this.btn.y = this.y
    let scaleRatio = scaleRatioUI(this.btn.height)
    scaleRatio = scaleRatio > 4 ? 4 : scaleRatio
    this.btn.scale.set(scaleRatio)
    this.btn.anchor.set(0.5)

    this.btn.interactive = true
    this.btn.on("pointerdown", () => {
      this.command(this.type)
    })

    try {app.stage.addChildAt(this.btn, 4)}
    catch (err){app.stage.addChildAt(this.btn, 3)}
  }
}
