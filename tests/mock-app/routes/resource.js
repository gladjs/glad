module.exports = {

  GET : [{
    path : '/resources',
    action : 'Get'
  },
  {
    path : '/resources/private',
    action : 'Get',
    policy : 'admin'
  },
  {
    path : '/resources/private',
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
