//#######1#########2#########3#########4#########5#########6#########7#########8#########9#########0
var Mongo=require('knuty');
var Mg=require('mongodb');

Mongo.extend({
  Db: {}, Table: '',
//ok
  open: function(op){
    var me=this; op=op||{}; var rc;
    if(!me.CFG){me.info();}
    op.server=op.server||me.CFG.mongo.server; op.port=op.port||me.CFG.mongo.port;
    op.db=op.db||me.CFG.mongo.db;
    var wid=me.ready();
    var dbn='mongodb://'+op.server+':'+op.port+'/'+op.db;
    Mg.MongoClient.connect(dbn, function(err, db){
      if(err){this.error=err; rc=false;}
      else{me.Db=db; me.Table=op.table; rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
// read
//    (テーブル名, {キー:値}, [項目])
  read: function(table, keys, items, op){
    var me=this; var rc=0; me.REC=[]; table=table||me.Table; me.Table=table;
    var wid=Mongo.ready(); var a, i; var fields={};
    var cur=me.Db.collection(table).find(keys, items, op);
    cur.toArray(function(err, docs){
      if(err){me.error=err; rc=0;}
      else{me.REC=docs; rc=docs.length;}
      Mongo.post(wid);
    });
    Mongo.wait(); return rc;
  },
//
// insert
//
  insert: function(table, op){
    var me=this; var rc; table=table||me.Table;
    for(var ix in me.REC){
      var wid=me.ready();
      if(me.REC[ix]._id){delete me.REC[ix]._id;}
      me.Db.collection(table).insert(me.REC[ix], op, function(err, obj){
        if(err){me.error=err; rc=false;}else{rc=true;}
        me.post(wid);
      });
      me.wait();
    }
    return rc;
  },
//
//
//
  rewrite: function(table, op){
    var me=this; var rc=false; table=table||me.Table;
    var wid=me.ready();
    var ix=0; var ex=0; while(ix<me.REC.length){
      if(me.REC[ix]._id){
        me.Db.collection(me.Table).save(me.REC[ix], {w: 1}, function(err){
          if(err){me.error=err; rc=false;}else{rc=true;}
          ex++; if(!ex<me.REC.length){me.post(wid);}
        });
      }else{
        me.error="データにIDがありません。ix="+ix;
        rc=false; me.post(); break;
      }
      ix++;
    }
    me.wait('rewrite'); return rc;
  },
//
  delete: function(op){
    var me=this; var rc=false; op=op||{}; op.multi=op.multi||true;
    var wid=me.ready(); var q={};
    var ix=0; var ex=0; while(ix<me.REC.length){
      q._id=me.REC[ix]['_id'];
      me.Db.collection(me.Table).remove(q, op, function(err){
        if(err){me.error=err; rc=false;}else{rc=true;}
        ex++; if(!ex<me.REC.length){me.post(wid);}
      });
      ix++;
    }
    me.wait(); return rc;
  },
//
  put: function(rec, table, op){
    var me=this; var rc=false; op=op||{}; op.multi=op.multi||true;
    table=table||me.Table;
    var wid=me.ready();
    me.Db.collection(table).insert([rec], op, function(err, d){
      if(err){me.error=err; rc=false;}else{rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
  save: function(rec, table, op){
    var me=this; var rc=false; op=op||{};
    table=table||me.Table;
    var wid=me.ready();
    me.Db.collection(table).save(rec, op, function(err, d){
      if(err){me.error=err; rc=false;}else{rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
  replace: function(keys, op){
    var me=this; var rc=false; op=op||{}; op.multi=op.multi||true;
    var wid=me.ready();
    me.Db.collection(me.Table).update(keys, me.REC[0], op, function(err, d){
      if(err){me.error=err; rc=false;}else{rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
  remove: function(keys, op){
    var me=this; var rc=false; op=op||{}; op.multi=op.multi||true;
    var wid=me.ready();
    me.Db.collection(me.Table).remove(keys, op, function(err){
      if(err){me.error=err; rc=false;}else{rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
  indexed: function(table, keys, op){
    var me=this; var rc; for(var k in keys){keys[k]=1;} op=op||{}; op.w=op.w||1;
    var wid=me.ready();
    me.Db.collection(table).createIndex(keys, op, function(err){
      if(err){me.error=err; rc=false;}else{rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
  drop: function(table){
    var me=this; var rc;
    var wid=me.ready();
    me.Db.collection(table).drop(function(err){
      if(err){me.error=err; rc=false;}else{rc=true;}
      me.post(wid);
    });
    me.wait(); return rc;
  },
//
  close: function(){
    this.Db.close();
  }
});
module.exports=Mongo;
