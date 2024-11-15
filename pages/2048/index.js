// index.js
Page({
  data: {
    board: [],
    score: 0,
    bestScore: 0,
    gameOver: false,
    showHelpModal: false
  },

  // 音频上下文
  audioContext: null,

  onLoad() {
    // 初始化音频上下文
    this.audioContext = wx.createWebAudioContext()
    this.initGame()
  },

  onUnload() {
    // 页面卸载时释放音频资源
    if (this.audioContext) {
      this.audioContext.close()
    }
  },

  // 生成移动音效
  playMoveSound() {
    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // 设置音效参数
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  },

  // 生成合并音效
  playMergeSound() {
    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // 设置音效参数
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  },

  onShow() {
    // 从存储中获取最高分
    const bestScore = wx.getStorageSync('bestScore') || 0
    this.setData({ bestScore })
  },

  initGame() {
    // 初始化4x4的游戏板
    const board = Array(4).fill(0).map(() => Array(4).fill(0))
    this.setData({
      board,
      score: 0,
      gameOver: false
    })
    // 添加两个初始数字
    this.addNewNumber()
    this.addNewNumber()
  },

  addNewNumber() {
    const emptyCells = []
    const { board } = this.data
    
    // 找出所有空位置
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }

    if (emptyCells.length > 0) {
      // 随机选择一个空位置
      const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      // 90%概率生成2，10%概率生成4
      board[i][j] = Math.random() < 0.9 ? 2 : 4
      this.setData({ board })
    }
  },

  onTouchStart(e) {
    this.startX = e.touches[0].pageX
    this.startY = e.touches[0].pageY
  },

  onTouchEnd(e) {
    const endX = e.changedTouches[0].pageX
    const endY = e.changedTouches[0].pageY
    const deltaX = endX - this.startX
    const deltaY = endY - this.startY

    // 判断滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this.moveRight()
      } else {
        this.moveLeft()
      }
    } else {
      if (deltaY > 0) {
        this.moveDown()
      } else {
        this.moveUp()
      }
    }
  },

  onTouchMove(e) {
    // 在小程序中直接返回 false 即可阻止页面滚动
    return false
  },

  moveLeft() {
    const { board } = this.data
    let moved = false
    let merged = false
    let currentMaxNumber = 0

    for (let i = 0; i < 4; i++) {
      let row = board[i].filter(x => x !== 0)
      let j = 0
      
      while (j < row.length - 1) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2
          currentMaxNumber = Math.max(currentMaxNumber, row[j])
          row.splice(j + 1, 1)
          moved = true
          merged = true  // 标记发生了合并
        }
        j++
      }
      
      while (row.length < 4) {
        row.push(0)
      }
      
      if (row.join(',') !== board[i].join(',')) {
        moved = true
      }
      board[i] = row

      currentMaxNumber = Math.max(currentMaxNumber, ...row)
    }

    if (moved) {
      // 播放音效
      try {
        if (merged) {
          this.playMergeSound()
        } else {
          this.playMoveSound()
        }
      } catch (e) {
        console.log('音效播放失败:', e)
      }

      let maxNumber = currentMaxNumber
      for (let i = 0; i < 4; i++) {
        maxNumber = Math.max(maxNumber, ...board[i])
      }
      
      this.setData({ 
        board,
        score: maxNumber
      })
      this.updateBestScore()
      this.addNewNumber()
      this.checkGameOver()
    }
  },

  moveRight() {
    const { board } = this.data
    // 水平翻转，使用moveLeft，再翻转回来
    for (let i = 0; i < 4; i++) {
      board[i].reverse()
    }
    this.moveLeft()
    for (let i = 0; i < 4; i++) {
      board[i].reverse()
    }
    this.setData({ board })
  },

  moveUp() {
    const { board } = this.data
    // 转置矩阵，使用moveLeft，再转置回来
    this.transpose()
    this.moveLeft()
    this.transpose()
    this.setData({ board })
  },

  moveDown() {
    const { board } = this.data
    this.transpose()
    this.moveRight()
    this.transpose()
    this.setData({ board })
  },

  transpose() {
    const { board } = this.data
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        [board[i][j], board[j][i]] = [board[j][i], board[i][j]]
      }
    }
  },

  updateBestScore() {
    const { score, bestScore } = this.data
    if (score > bestScore) {
      this.setData({ bestScore: score })
      wx.setStorageSync('bestScore', score)
    }
  },

  checkGameOver() {
    const { board } = this.data
    // 检查是否还有空格
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) return
      }
    }
    // 检查是否还有可以合并的相邻数字
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === board[i][j + 1]) return
        if (board[j][i] === board[j + 1][i]) return
      }
    }
    // 游戏结束
    this.setData({ gameOver: true })
  },

  restartGame() {
    this.initGame()
  },

  showHelp() {
    this.setData({
      showHelpModal: true
    })
  },

  closeHelp() {
    this.setData({
      showHelpModal: false
    })
  }
})
