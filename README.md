# 2020年回来更新:

12306有了候补票之后这东西已经没有价值了(~~虽然本来也没什么价值~~)


# 12306余票提醒
监控指定日期、车次、席别的余票情况, 有票时发送邮箱通知

### 1.使用
配置文件
```js
module.exports = {
  ticket: { // 票务设置
    date: '2018-02-24',
    from: '广州南',  // 始发站
    to: '北京西', // 终到站
    purposeCodes: 'ADULT', // 票种
    seatTypes: [2, 5],  // 所要监控的席别 0:商务1:一等2:二等3:高级软卧4:软卧5:动卧6:硬卧7:软座8:硬座9:无座
    trainType: /^D\d{1,4}$/ // 列车号过滤规则(正则)
  },
  transporter: { // SMTP设置
    host: 'smtp.example.com', // 支持STMP的服务器
    port: 465,  // 端口
    secure: true, // true的话端口用465, false的话用其他
    auth: {
      user: 'youremail@example.com', // 设置STMP的邮箱
      pass: 'yourpassword'  // 设置STMP的邮箱密码(163,qq邮箱是授权码)
    }
  },
  mailOptions: {  // 邮件内容设置
    from: '"Big Brother" <XiaoMing@example.com>', // 发送者
    to: 'LiHua@example.com, XiaoHong@example.com', // 接受者(们, 多个用逗号隔开)
    subject: '', // 邮件主题(不用管)
    text: '', // 邮件纯文本(不用管)
    html: ''  // 邮件HTML(不用管)
  }
}
```
##### PS: `mailOptions`中一般来讲只要修改`from`和`to`就行了, `sebject`和`html`会自动生成, 如果嫌发送的邮件样式太难看, 可以自行修改源代码

运行程序
```bash
$ npm start
```
