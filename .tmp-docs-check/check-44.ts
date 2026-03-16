// 发送邮件异步处理
queue.add('send-email', {
  to: user.email,
  subject: 'Welcome',
  body: 'Welcome to our service'
});
