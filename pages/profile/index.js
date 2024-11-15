Page({
  data: {
    isLoggedIn: false,
    userInfo: {}
  },

  onLoad() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    // 检查本地存储的登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      });
    }
  },

  handleLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        // 添加用户ID，实际应用中可能需要从后端获取
        userInfo.userId = this.generateUserId();
        
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo
        });
      },
      fail: (err) => {
        console.error('登录失败', err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  generateUserId() {
    // 这里只是示例，实际应用中应该由后端生成用户ID
    return 'USER_' + Math.random().toString(36).substr(2, 9);
  }
}); 