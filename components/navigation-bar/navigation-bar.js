Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    color: {
      type: String,
      value: '#000000'
    },
    background: {
      type: String,
      value: '#ffffff'
    },
    fixed: {
      type: Boolean,
      value: true
    }
  },
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    menuButtonHeight: 0,
    menuButtonTop: 0
  },
  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync()
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        menuButtonHeight: menuButtonInfo.height,
        menuButtonTop: menuButtonInfo.top,
        navBarHeight: (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height
      })
    }
  }
})
