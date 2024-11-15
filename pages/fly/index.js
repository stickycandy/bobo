Page({
  data: {
    score: 0,
    gameOver: false,
    difficultyLevel: 1,
    enemySpawnInterval: 1500,
    shootingInterval: 400,
    enemySpeed: 3
  },

  onLoad() {
    this.initGame()
  },

  async initGame() {
    const query = wx.createSelectorQuery()
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          console.error('未找到 canvas 节点')
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        const systemInfo = wx.getSystemInfoSync()
        const screenWidth = systemInfo.windowWidth
        const screenHeight = systemInfo.windowHeight
        
        canvas.width = screenWidth
        canvas.height = screenHeight
        
        this.canvas = canvas
        this.ctx = ctx
        this.screenWidth = screenWidth
        this.screenHeight = screenHeight
        
        this.initGameObjects()
        this.startGameLoop()
        this.startEnemySpawn()
        this.startShooting()
      })
  },

  initGameObjects() {
    if (!this.canvas) return
    
    // 初始化玩家飞机
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 100,
      width: 40,
      height: 60,
      speed: 5
    }
    
    this.bullets = []
    this.enemies = []
    this.bulletSpeed = 8
    
    // 重置分数和难度
    this.setData({ score: 0, gameOver: false, difficultyLevel: 1 })
  },

  startGameLoop() {
    if (!this.ctx) return
    
    const loop = () => {
      if (!this.data.gameOver) {
        this.update()
        this.render()
        this.increaseDifficulty()
      }
      this.animationFrame = setTimeout(() => {
        loop()
      }, 1000 / 60)
    }
    loop()
  },

  startEnemySpawn() {
    this.enemyInterval = setInterval(() => {
      if (!this.data.gameOver) {
        this.createEnemy()
      }
    }, this.data.enemySpawnInterval)
  },

  startShooting() {
    this.shootingIntervalId = setInterval(() => {
      if (!this.data.gameOver) {
        this.createBullet()
      }
    }, this.data.shootingInterval)
  },

  createEnemy() {
    const enemy = {
      x: Math.random() * (this.screenWidth - 30),
      y: -30,
      width: 30,
      height: 30
    }
    this.enemies.push(enemy)
  },

  createBullet() {
    const bullet = {
      x: this.player.x,
      y: this.player.y - this.player.height / 2,
      width: 4,
      height: 15,
      color: '#FF3333'
    }
    this.bullets.push(bullet)
  },

  update() {
    if (!this.ctx) return

    // 更新子弹位置
    this.bullets = this.bullets.filter(bullet => {
      bullet.y -= this.bulletSpeed
      return bullet.y > -bullet.height
    })

    // 更新敌机位置
    let enemiesDestroyed = []  // 记录要销毁的敌机索引
    
    this.enemies.forEach((enemy, enemyIndex) => {
      enemy.y += this.data.enemySpeed
      
      // 检查是否超出屏幕底部
      if (enemy.y > this.screenHeight) {
        enemiesDestroyed.push(enemyIndex)
        return
      }
      
      // 检查是否与玩家碰撞
      if (this.checkCollision(this.player, enemy)) {
        this.gameOver()
        return
      }
      
      // 检查是否被子弹击中
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i]
        if (this.checkCollision(bullet, enemy)) {
          this.bullets.splice(i, 1)  // 移除子弹
          enemiesDestroyed.push(enemyIndex)  // 标记敌机待销毁
          this.setData({
            score: this.data.score + 10
          })
          break
        }
      }
    })
    
    // 从后向前移除被销毁的敌机
    for (let i = enemiesDestroyed.length - 1; i >= 0; i--) {
      this.enemies.splice(enemiesDestroyed[i], 1)
    }
  },

  render() {
    if (!this.ctx) return
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制背景
    this.ctx.fillStyle = '#001133'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制玩家
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillRect(
      this.player.x - this.player.width / 2,
      this.player.y - this.player.height / 2,
      this.player.width,
      this.player.height
    )
    
    // 绘制子弹
    this.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.color
      this.ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height)
    })
    
    // 绘制敌机
    this.ctx.fillStyle = '#00FF00'
    this.enemies.forEach(enemy => {
      this.ctx.fillRect(
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height
      )
    })
  },

  increaseDifficulty() {
    // 每30秒增加一次难度
    if (this.data.score > 0 && this.data.score % 100 === 0) {
      this.setData({
        difficultyLevel: this.data.difficultyLevel + 1,
        enemySpeed: this.data.enemySpeed + 1,
        enemySpawnInterval: Math.max(500, this.data.enemySpawnInterval - 100),
        shootingInterval: Math.max(200, this.data.shootingInterval - 50)
      })

      // 更新定时器
      clearInterval(this.enemyInterval)
      this.startEnemySpawn()

      clearInterval(this.shootingIntervalId)
      this.startShooting()
    }
  },

  checkCollision(rect1, rect2) {
    const r1x = rect1.x - rect1.width / 2
    const r1y = rect1.y - rect1.height / 2
    const r2x = rect2.x
    const r2y = rect2.y
    
    return r1x < (r2x + rect2.width) &&
           (r1x + rect1.width) > r2x &&
           r1y < (r2y + rect2.height) &&
           (r1y + rect1.height) > r2y
  },

  handleTouchStart(e) {
    const touch = e.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
    
    if (this.player) {
      this.playerStartX = this.player.x
      this.playerStartY = this.player.y
    }
  },

  handleTouchMove(e) {
    if (!this.player || this.data.gameOver) return
    const touch = e.touches[0]
    
    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY
    
    let newX = this.playerStartX + deltaX
    let newY = this.playerStartY + deltaY
    
    this.player.x = Math.max(
      this.player.width / 2,
      Math.min(newX, this.screenWidth - this.player.width / 2)
    )
    this.player.y = Math.max(
      this.player.height / 2,
      Math.min(newY, this.screenHeight - this.player.height / 2)
    )
  },

  handleTouchEnd() {
    this.startX = null
    this.startY = null
    this.playerStartX = null
    this.playerStartY = null
  },

  gameOver() {
    this.setData({ gameOver: true })
    wx.showModal({
      title: '游戏结束',
      content: `得分：${this.data.score}`,
      showCancel: false,
      success: () => {
        this.restartGame()
      }
    })
  },

  restartGame() {
    this.bullets = []
    this.enemies = []
    
    this.initGameObjects()
  },

  onUnload() {
    if (this.animationFrame) {
      clearTimeout(this.animationFrame)
    }
    if (this.enemyInterval) {
      clearInterval(this.enemyInterval)
    }
    if (this.shootingIntervalId) {
      clearInterval(this.shootingIntervalId)
    }
  }
}) 