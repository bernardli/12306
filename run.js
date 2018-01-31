const superagent = require('superagent')
const nodemailer = require('nodemailer')
const config = require('./config/config')
const stationName = require('./station_name')
const transporter = nodemailer.createTransport(config.transporter);
/**
 * @description 延时函数,返回一个指定时间后resolve的promise
 * @param {number} time 延迟时间, 单位ms
 * @returns {promise}
 */
function sleep(time) {
  return new Promise((rel, rej) => {
    setTimeout(rel, time);
  })
}
/**
 * @description 根据trains生成HTML模板
 * @param {array} trains 各车次的票务信息数组
 * @returns {string}
 */
function template(trains) {
  let str = ``
  trains.forEach(item => {
    let tr = '<tr>'
    item.forEach(x => {
      tr += `<td>${x}</td>`
    })
    tr += '</tr>'
    str += tr
  })
  return `
  <table>
    <caption>${config.ticket.date}</caption>
    <thead>
      <tr>
        <th>车号</th>
        <th>商务座特等座</th>
        <th>一等座</th>
        <th>二等座</th>
        <th>高级软卧</th>
        <th>软卧</th>
        <th>动卧</th>
        <th>硬卧</th>
        <th>软座</th>
        <th>硬座</th>
        <th>无座</th>
      </tr>
    </thead>
    <tbody>
      ${str}
    </tbody>
  </table>
  `
}
/**
 * @description 返回数组中的随机一项
 * @param {array} arr 源数组
 * @returns {any} 
 */
function arrayRandom(arr) {
  return arr[Math.round(Math.random() * arr.length - 1)]
}
/**
 * @description 查看所监控
 * @param {array} seatTypes 要监控的席别数组
 * @param {array} tickets 该车次的各个席别票数数组
 * @returns {bool}
 */
function hasLeftTicket(seatTypes, tickets) {
  for (let i = 0, len = seatTypes.length; i < len; i++) {
    if (/^(有|[0-9]*)$/.test(tickets[seatTypes[i] + 1])) {
      return true
    }
  }
  return false
}
/**
 * @description 根据筛选后的车次信息发送邮件
 * @param {array} trains 
 * @returns {promise}
 */
function sendMail(trains) {
  let mailOptions = Object.assign({}, config.mailOptions)
  mailOptions.html = template(trains)
  mailOptions.subject = `${config.ticket.date}: ${config.ticket.from} -=> ${config.ticket.to}`
  console.log('尝试发送邮件...')
  return new Promise((rel, rej) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        throw { code: 'MAILFAIL', message: '我也不知道为什么反正发邮件失败了' }
        // return console.log(error)
      }
      // console.log('Message sent: %s', info.messageId)
      rel()
    })
  })
}
/**
 * @description 发起请求,查询票务信息
 * @returns {promise}
 */
function request() {
  return superagent
    .get('https://kyfw.12306.cn/otn/leftTicket/queryZ')
    .query({
      'leftTicketDTO.train_date': config.ticket.date,
      'leftTicketDTO.from_station': stationName[config.ticket.from],
      'leftTicketDTO.to_station': stationName[config.ticket.to],
      'purpose_codes': config.ticket.purposeCodes
    })
    .timeout(8000)
}
/**
 * @description 分析request的返回信息, 返回过滤后的车次及相关信息
 * @param {object} res 
 * @returns {string} 
 */
function filter(res) {
  if (res.status !== 200 || res.body.data === undefined) {
    throw { code: 'CANTRECEIVE', message: '获取不到, 怕是被ban了哟' }
  }
  let trains = res.body.data.result
    .map(x => x.split('|'))
    .filter(x => config.ticket.trainType.test(x[3])) // 过滤不要的车次
    .map(x => [
      x[3], x[32], x[31], x[30],
      x[21], x[23], x[33], x[28],
      x[24], x[29], x[26]
    ])
    .filter(x => hasLeftTicket(config.ticket.seatTypes, x)) // 过滤没票的车次 
  if (trains.length !== 0) {
    return trains
  } else {
    throw { code: 'NOTICKET', message: `${config.ticket.date} ${config.ticket.from} -> ${config.ticket.to}: 没有票QAQ` }
  }
}
/**
 * @description 主运行函数
 */
async function run() {
  for (; ;) {
    try {
      let res = await Promise.all([sleep(5000), request()]).then(values => { return values[1] })
      let trains = filter(res)
      console.log(`${config.ticket.date} ${config.ticket.from} -> ${config.ticket.to}: 监控席别有票!`)
      await sendMail(trains)
      console.log('邮件发送成功! 15分钟后继续查询')
      await sleep(1000 * 60 * 15)
    } catch (err) {
      console.log(err.message)
    }
  }
}

run()


// 记录一下
// 21 -> 高级软卧
// 23 -> 软卧
// 24 -> 软座
// 26 -> 无座
// 28 -> 硬卧
// 29 -> 硬座
// 30 -> 二等座
// 31 -> 一等座
// 32 -> 商务座特等座
// 33 -> 动卧