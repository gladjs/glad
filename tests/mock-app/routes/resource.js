module.exports = {

  GET : [{
    path : '/resources',
    action : 'Get',
    rateLimit : {
      requests : 10,
      per : 800,
      onLimit : {
        code : 429,
        msg  : "You can only read 10 resources per second. Please try again later"
      }
    }
  },
  {
    path : '/resources/blast-protected',
    action : 'Get',
    rateLimit : {
      requests : 10,
      per : 800,
      waitTime : 100,
      onLimit : {
        code : 429,
        msg  : "You can only read 10 resources per second. Please try again later"
      }
    }
  },
  {
    path : '/resources/private',
    action : 'Get',
    policy : 'admin'
  },
  {
    path : '/resources/not-private',
    action : 'Get',
    policy : 'goodToGo'
  },
  {
    path : '/resources/:id',
    action : 'FindOne'
  }],

  POST : [{
    path : '/resources',
    action : 'Post'
  }],

  PUT : [{
    path : '/resources/:id',
    action : 'Put'
  }],

  DELETE : [{
    path : '/resources',
    action : 'destroy'
  },
  {
    path : '/resources/all',
    action : 'destroyAll'
  }]

};
