#!/usr/bin/env node

/**
 * Box盲盒商城数据转换器
 * 将Box_Mall.sql数据库结构转换为DevAPI Manager项目格式
 * 
 * 创建日期: 2025-01-15
 * 作者: Claude Code Assistant
 */

const fs = require('fs')
const path = require('path')

// Box盲盒核心业务表到DevAPI Manager项目的映射配置
const BOX_MALL_TO_DEVAPI_MAPPING = {
  // 项目配置
  projects: [
    {
      id: 'box-mall-system',
      name: 'Box次元盲盒商城系统',
      description: '一个集成电商、游戏、社交功能的综合性盲盒平台，支持多级分销、概率抽奖、会员体系等核心功能',
      version: '1.0.0',
      status: 'ACTIVE',
      tags: ['电商', '游戏化', '社交', '分销', '盲盒'],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
  ],
  
  // 表分类
  categories: [
    { id: 'user-management', name: '用户管理模块', color: '#3B82F6', description: '用户注册、认证、权限、会员等功能' },
    { id: 'product-catalog', name: '商品目录管理', color: '#10B981', description: '商品分类、库存、价格、盲盒配置等' },
    { id: 'order-transaction', name: '订单交易系统', color: '#F59E0B', description: '订单流程、支付处理、物流管理等' },
    { id: 'gaming-rewards', name: '游戏奖励机制', color: '#8B5CF6', description: '盲盒抽奖、概率控制、奖品管理等' },
    { id: 'social-community', name: '社交社区功能', color: '#EF4444', description: '用户互动、内容分享、关注系统等' },
    { id: 'financial-commission', name: '财务佣金体系', color: '#06B6D4', description: '分销返佣、提现管理、财务记录等' },
    { id: 'system-config', name: '系统配置管理', color: '#84CC16', description: '平台设置、后台管理、系统配置等' }
  ],

  // 数据表映射
  tables: [
    // 用户管理模块
    {
      id: 'box_user',
      name: 'box_user',
      displayName: '用户信息表',
      categoryId: 'user-management',
      description: '核心用户表，包含注册信息、财务状态、会员等级、分销关系等完整用户数据',
      comment: '支持多平台登录(微信/APP/H5)，包含VIP会员、分销代理、财务余额等功能',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      status: 'ACTIVE',
      tags: ['核心表', '用户认证', '会员体系', '分销代理'],
      estimatedRows: 9000,
      fields: [
        { name: 'id', type: 'int', size: 11, unsigned: true, autoIncrement: true, primaryKey: true, comment: '用户ID主键' },
        { name: 'group_id', type: 'int', size: 11, unsigned: true, defaultValue: '0', comment: '用户组别ID' },
        { name: 'username', type: 'varchar', size: 32, comment: '用户名' },
        { name: 'nickname', type: 'varchar', size: 50, comment: '用户昵称' },
        { name: 'password', type: 'varchar', size: 32, comment: '密码(MD5)' },
        { name: 'salt', type: 'varchar', size: 30, comment: '密码盐值' },
        { name: 'email', type: 'varchar', size: 100, comment: '邮箱地址' },
        { name: 'mobile', type: 'varchar', size: 11, comment: '手机号码' },
        { name: 'avatar', type: 'varchar', size: 255, comment: '头像URL' },
        { name: 'level', type: 'tinyint', size: 3, unsigned: true, defaultValue: '0', comment: '用户等级' },
        { name: 'gender', type: 'tinyint', size: 3, unsigned: true, defaultValue: '0', comment: '性别:0=未知,1=男,2=女' },
        { name: 'birthday', type: 'date', comment: '生日' },
        { name: 'money', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '烛星石余额' },
        { name: 'balance', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '账户余额' },
        { name: 'score', type: 'int', size: 11, defaultValue: '0', comment: '积分' },
        { name: 'invitation', type: 'varchar', size: 255, comment: '邀请码' },
        { name: 'pid', type: 'int', size: 11, comment: '上级用户ID(分销关系)' },
        { name: 'wx_mini_openid', type: 'varchar', size: 50, comment: '微信小程序OpenID' },
        { name: 'wx_app_openid', type: 'varchar', size: 255, comment: '微信APP OpenID' },
        { name: 'unionid', type: 'varchar', size: 50, comment: '微信UnionID' },
        { name: 'agent', type: 'tinyint', size: 1, defaultValue: '2', comment: '分销员状态:1=是,2=否' },
        { name: 'agent_lev_id', type: 'int', size: 11, defaultValue: '0', comment: '分销等级ID' },
        { name: 'wallet_left', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '可用佣金' },
        { name: 'wallet_tx', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '已提现佣金' },
        { name: 'vip_end_time', type: 'int', size: 11, defaultValue: '0', comment: 'VIP到期时间' },
        { name: 'total_consume', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '累计消费金额' },
        { name: 'status', type: 'varchar', size: 30, defaultValue: 'normal', comment: '用户状态' },
        { name: 'logintime', type: 'bigint', size: 20, comment: '最后登录时间' },
        { name: 'loginip', type: 'varchar', size: 50, comment: '最后登录IP' },
        { name: 'createtime', type: 'bigint', size: 20, comment: '注册时间' },
        { name: 'updatetime', type: 'bigint', size: 20, comment: '更新时间' }
      ],
      indexes: [
        { name: 'idx_username', type: 'INDEX', fields: ['username'] },
        { name: 'idx_mobile', type: 'INDEX', fields: ['mobile'] },
        { name: 'idx_email', type: 'INDEX', fields: ['email'] },
        { name: 'idx_invitation', type: 'INDEX', fields: ['invitation'] },
        { name: 'idx_wx_mini_openid', type: 'INDEX', fields: ['wx_mini_openid'] }
      ]
    },

    // 商品目录管理
    {
      id: 'box_goods',
      name: 'box_goods',
      displayName: '商品信息表',
      categoryId: 'product-catalog',
      description: '商城商品目录表，支持实物和虚拟商品，包含价格体系、库存管理、分销配置等',
      comment: '支持RMB和幸运币双币种定价，预售功能，分销返佣设置',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      status: 'ACTIVE',
      tags: ['商品管理', '库存控制', '价格体系', '分销商品'],
      estimatedRows: 2000,
      fields: [
        { name: 'id', type: 'int', size: 11, primaryKey: true, autoIncrement: true, comment: '商品ID' },
        { name: 'goodcategory_id', type: 'int', size: 11, comment: '商品分类ID' },
        { name: 'goods_name', type: 'varchar', size: 255, notNull: true, comment: '商品名称' },
        { name: 'price', type: 'decimal', size: '10,2', notNull: true, comment: '人民币价格' },
        { name: 'c_price', type: 'int', size: 11, defaultValue: '0', comment: '幸运币价格' },
        { name: 'stock', type: 'int', size: 11, comment: '库存数量' },
        { name: 'good_images', type: 'text', comment: '商品图片(JSON数组)' },
        { name: 'gooddetails', type: 'text', comment: '商品详情HTML' },
        { name: 'freight', type: 'decimal', size: '8,2', defaultValue: '0.00', comment: '运费' },
        { name: 'type', type: 'tinyint', size: 1, defaultValue: '0', comment: '商品类型:0=实物,1=虚拟' },
        { name: 'goods_switch', type: 'tinyint', size: 1, defaultValue: '1', comment: '商品状态:0=下架,1=上架' },
        { name: 'sort', type: 'int', size: 11, defaultValue: '99', comment: '排序权重' },
        { name: 'box_goods_switch', type: 'tinyint', size: 1, defaultValue: '0', comment: '盲盒商品库:0=隐藏,1=显示' },
        { name: 'is_presale', type: 'tinyint', size: 1, defaultValue: '0', comment: '预售状态:0=否,1=是' },
        { name: 'delivery_date', type: 'date', comment: '预计发货日期' },
        { name: 'goodscode', type: 'varchar', size: 255, comment: '商品编码' },
        { name: 'luckycoin', type: 'int', size: 11, defaultValue: '0', comment: '兑换获得幸运币' },
        { name: 'agent', type: 'tinyint', size: 1, defaultValue: '2', comment: '参与分销:1=是,2=否' },
        { name: 'agent_lev1', type: 'decimal', size: '5,2', defaultValue: '0.00', comment: '一级分销比例%' },
        { name: 'agent_lev2', type: 'decimal', size: '5,2', defaultValue: '0.00', comment: '二级分销比例%' }
      ],
      indexes: [
        { name: 'idx_category', type: 'INDEX', fields: ['goodcategory_id'] },
        { name: 'idx_status', type: 'INDEX', fields: ['goods_switch'] },
        { name: 'idx_sort', type: 'INDEX', fields: ['sort'] }
      ]
    },

    // 盲盒配置表
    {
      id: 'box_boxfl',
      name: 'box_boxfl',
      displayName: '盲盒配置表',
      categoryId: 'gaming-rewards',
      description: '盲盒核心配置表，包含概率设置、价格策略、限购规则、特殊玩法等游戏机制',
      comment: '支持无限赏和一番赏两种模式，四级概率控制，连抽优惠，会员特权等',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      status: 'ACTIVE',
      tags: ['盲盒游戏', '概率控制', '限购策略', '会员特权'],
      estimatedRows: 127,
      fields: [
        { name: 'id', type: 'int', size: 11, primaryKey: true, autoIncrement: true, comment: '盲盒ID' },
        { name: 'game_type', type: 'enum', values: ['unend', 'limit'], defaultValue: 'unend', comment: '游戏类型:unend=无限赏,limit=一番赏' },
        { name: 'box_name', type: 'varchar', size: 255, notNull: true, comment: '盲盒名称' },
        { name: 'box_cate_id', type: 'int', size: 11, defaultValue: '0', comment: '盲盒分类ID' },
        { name: 'box_banner_images', type: 'text', comment: '首页轮播图(JSON)' },
        { name: 'box_foot_images', type: 'text', comment: '底部展示图(JSON)' },
        { name: 'box_label', type: 'varchar', size: 255, comment: '盲盒标签' },
        { name: 'box_label2', type: 'varchar', size: 255, comment: '盲盒副标签' },
        { name: 'price', type: 'decimal', size: '8,2', comment: '单抽价格' },
        { name: 'probability_gj', type: 'decimal', size: '5,2', notNull: true, comment: '高级商品概率%' },
        { name: 'probability_xy', type: 'decimal', size: '5,2', notNull: true, comment: '稀有商品概率%' },
        { name: 'probability_ss', type: 'decimal', size: '5,2', notNull: true, comment: '史诗商品概率%' },
        { name: 'probability_cs', type: 'decimal', size: '5,2', notNull: true, comment: '传说商品概率%' },
        { name: 'boxswitch', type: 'tinyint', size: 1, notNull: true, comment: '盲盒开关:0=关闭,1=开启' },
        { name: 'first_order_discount', type: 'tinyint', size: 1, defaultValue: '0', comment: '新人首单优惠:0=否,1=是' },
        { name: 'sort', type: 'int', size: 11, defaultValue: '99', comment: '排序权重' },
        { name: '5times_draw', type: 'varchar', size: 255, comment: '5抽必中商品ID列表' },
        { name: '10times_draw', type: 'varchar', size: 255, comment: '10抽必中商品ID列表' },
        { name: 'lcyhbl', type: 'int', size: 11, defaultValue: '0', comment: '连抽优惠比例%' },
        { name: 'lcyhjg', type: 'decimal', size: '8,2', comment: '连抽优惠价格' },
        { name: 'five_vip_days', type: 'int', size: 11, defaultValue: '0', comment: '5抽赠送VIP天数' },
        { name: 'ten_vip_days', type: 'int', size: 11, defaultValue: '0', comment: '10抽赠送VIP天数' },
        { name: 'buy_limit', type: 'int', size: 11, defaultValue: '0', comment: '每日限购次数' },
        { name: 'buy_limit_price', type: 'decimal', size: '10,2', comment: '解锁限购消费门槛' },
        { name: 'first_price', type: 'decimal', size: '8,2', comment: '首单特价' },
        { name: 'is_free', type: 'tinyint', size: 1, defaultValue: '0', comment: '免费抽取:0=否,1=是' },
        { name: 'box_num', type: 'int', size: 11, defaultValue: '1', comment: '开启箱数' },
        { name: 'lock_status', type: 'tinyint', size: 1, defaultValue: '0', comment: '锁盒功能:0=关闭,1=开启' },
        { name: 'show_index', type: 'tinyint', size: 1, defaultValue: '0', comment: '首页展示:0=否,1=是' },
        { name: 'agent', type: 'tinyint', size: 1, defaultValue: '2', comment: '参与分销:1=是,2=否' },
        { name: 'agent_lev1', type: 'decimal', size: '5,2', defaultValue: '0.00', comment: '一级分销比例%' },
        { name: 'agent_lev2', type: 'decimal', size: '5,2', defaultValue: '0.00', comment: '二级分销比例%' },
        { name: 'fragment_mode', type: 'tinyint', size: 1, defaultValue: '0', comment: '碎片模式:0=关闭,1=开启' },
        { name: 'fragment_cost', type: 'decimal', size: '8,2', defaultValue: '9.90', comment: '碎片模式费用' },
        { name: 'is_del', type: 'tinyint', size: 1, defaultValue: '0', comment: '删除状态:0=正常,1=删除' }
      ],
      indexes: [
        { name: 'idx_category', type: 'INDEX', fields: ['box_cate_id'] },
        { name: 'idx_status', type: 'INDEX', fields: ['boxswitch'] },
        { name: 'idx_sort', type: 'INDEX', fields: ['sort'] }
      ]
    },

    // 订单交易表
    {
      id: 'box_order',
      name: 'box_order',
      displayName: '盲盒订单表',
      categoryId: 'order-transaction',
      description: '盲盒购买订单核心表，支持多种支付方式、优惠券、代付、送礼等功能',
      comment: '完整的订单生命周期管理，包含支付、开盒、分销、礼品功能',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      status: 'ACTIVE',
      tags: ['订单管理', '支付处理', '盲盒开启', '分销佣金'],
      estimatedRows: 3600,
      fields: [
        { name: 'id', type: 'int', size: 11, primaryKey: true, autoIncrement: true, comment: '订单ID' },
        { name: 'boxfl_id', type: 'int', size: 11, comment: '盲盒ID' },
        { name: 'boxfl_name', type: 'varchar', size: 255, comment: '盲盒名称' },
        { name: 'image', type: 'varchar', size: 255, comment: '盲盒主图' },
        { name: 'user_id', type: 'int', size: 11, comment: '购买用户ID' },
        { name: 'pay_method', type: 'enum', values: ['wechat', 'alipay', 'yue', 'xyb', 'sand'], comment: '支付方式' },
        { name: 'total_fee', type: 'decimal', size: '10,2', comment: '订单原价' },
        { name: 'xingshi', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '星石抵扣金额' },
        { name: 'coupon_fee', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '优惠券抵扣' },
        { name: 'pay_coin', type: 'decimal', size: '10,2', comment: '实际支付金额' },
        { name: 'out_trade_no', type: 'varchar', size: 100, notNull: true, comment: '商户订单号' },
        { name: 'transaction_id', type: 'varchar', size: 100, comment: '第三方交易号' },
        { name: 'pay_time', type: 'int', size: 11, comment: '支付时间' },
        { name: 'status', type: 'enum', values: ['unpay', 'used', 'undei', 'unopen'], defaultValue: 'unpay', comment: '订单状态' },
        { name: 'num', type: 'int', size: 11, comment: '购买数量' },
        { name: 'delivery_fee', type: 'decimal', size: '8,2', defaultValue: '0.00', comment: '运费' },
        { name: 'ischou', type: 'tinyint', size: 1, defaultValue: '0', comment: '是否已抽奖:0=否,1=是' },
        { name: 'open_time', type: 'int', size: 11, comment: '开盒时间' },
        { name: 'gift_status', type: 'tinyint', size: 1, defaultValue: '0', comment: '送礼状态:0=无,1=待领取,2=已领取' },
        { name: 'gift_send_uid', type: 'int', size: 11, comment: '赠送对象用户ID' },
        { name: 'gift_receive_time', type: 'int', size: 11, comment: '礼物领取时间' },
        { name: 'is_behalf_pay', type: 'tinyint', size: 1, defaultValue: '0', comment: '代付订单:0=否,1=是' },
        { name: 'behalf_uid', type: 'int', size: 11, comment: '代付人ID' },
        { name: 'agent_lev1_uid', type: 'int', size: 11, defaultValue: '0', comment: '一级分销用户ID' },
        { name: 'agent_lev1_percent', type: 'decimal', size: '5,2', defaultValue: '0.00', comment: '一级分销比例%' },
        { name: 'agent_lev1_price', type: 'decimal', size: '8,2', defaultValue: '0.00', comment: '一级分销佣金' },
        { name: 'agent_lev2_uid', type: 'int', size: 11, defaultValue: '0', comment: '二级分销用户ID' },
        { name: 'agent_lev2_percent', type: 'decimal', size: '5,2', defaultValue: '0.00', comment: '二级分销比例%' },
        { name: 'agent_lev2_price', type: 'decimal', size: '8,2', defaultValue: '0.00', comment: '二级分销佣金' },
        { name: 'fragment_mode', type: 'tinyint', size: 1, defaultValue: '0', comment: '碎片模式:0=否,1=是' },
        { name: 'fragment_results', type: 'text', comment: '碎片抽取结果(JSON)' },
        { name: 'terminal', type: 'tinyint', size: 1, comment: '下单终端:0=H5,1=小程序,2=APP' },
        { name: 'create_time', type: 'int', size: 11, comment: '创建时间' },
        { name: 'update_time', type: 'int', size: 11, comment: '更新时间' },
        { name: 'delete_time', type: 'int', size: 11, comment: '删除时间' }
      ],
      indexes: [
        { name: 'idx_out_trade_no', type: 'UNIQUE', fields: ['out_trade_no'] },
        { name: 'idx_user_id', type: 'INDEX', fields: ['user_id'] },
        { name: 'idx_boxfl_id', type: 'INDEX', fields: ['boxfl_id'] },
        { name: 'idx_status', type: 'INDEX', fields: ['status'] },
        { name: 'idx_pay_time', type: 'INDEX', fields: ['pay_time'] }
      ]
    },

    // 中奖记录表
    {
      id: 'box_prize_record',
      name: 'box_prize_record',
      displayName: '中奖记录表',
      categoryId: 'gaming-rewards',
      description: '用户开盒中奖记录表，包含奖品信息、状态流转、物流处理等完整生命周期',
      comment: '支持多种奖品来源，完整的奖品状态管理，社交赠送功能',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      status: 'ACTIVE',
      tags: ['中奖记录', '奖品管理', '物流处理', '社交赠送'],
      estimatedRows: 11500,
      fields: [
        { name: 'id', type: 'int', size: 11, primaryKey: true, autoIncrement: true, comment: '记录ID' },
        { name: 'boxfl_id', type: 'int', size: 11, notNull: true, comment: '盲盒ID' },
        { name: 'order_id', type: 'varchar', size: 255, notNull: true, comment: '关联订单ID' },
        { name: 'out_trade_no', type: 'varchar', size: 100, comment: '商户订单号' },
        { name: 'user_id', type: 'int', size: 11, notNull: true, comment: '中奖用户ID' },
        { name: 'goods_id', type: 'int', size: 11, notNull: true, comment: '奖品商品ID' },
        { name: 'goods_name', type: 'varchar', size: 255, comment: '奖品名称' },
        { name: 'goods_image', type: 'varchar', size: 255, comment: '奖品图片' },
        { name: 'goods_coin_price', type: 'int', size: 11, defaultValue: '0', comment: '奖品幸运币价值' },
        { name: 'goods_rmb_price', type: 'decimal', size: '10,2', defaultValue: '0.00', comment: '奖品RMB价值' },
        { name: 'status', type: 'enum', values: ['bag', 'exchange', 'delivery', 'received', 'send', 'gift'], comment: '奖品状态' },
        { name: 'tag', type: 'enum', values: ['normal', 'rare', 'supreme', 'legend', 'S', 'A', 'B', 'C', 'D'], comment: '奖品稀有度' },
        { name: 'source', type: 'enum', values: ['qiandao', 'kami', 'renwu', 'sys', 'mh', 'send', 'gift'], defaultValue: 'mh', comment: '奖品来源' },
        { name: 'exchange_time', type: 'int', size: 11, comment: '回收时间' },
        { name: 'delivery_time', type: 'int', size: 11, comment: '发货时间' },
        { name: 'delivery_fee', type: 'decimal', size: '8,2', defaultValue: '0.00', comment: '运费' },
        { name: 'to_user_id', type: 'int', size: 11, defaultValue: '0', comment: '赠送目标用户ID' },
        { name: 'from_user_id', type: 'int', size: 11, defaultValue: '0', comment: '赠送来源用户ID' },
        { name: 'send_time', type: 'int', size: 11, defaultValue: '0', comment: '赠送时间' },
        { name: 'is_presale', type: 'tinyint', size: 1, defaultValue: '0', comment: '预售商品:0=否,1=是' },
        { name: 'delivery_date', type: 'date', comment: '预计发货日期' },
        { name: 'box_num_no', type: 'int', size: 11, defaultValue: '1', comment: '箱次编号' },
        { name: 'memo', type: 'varchar', size: 255, comment: '备注信息' },
        { name: 'create_time', type: 'int', size: 11, comment: '中奖时间' },
        { name: 'update_time', type: 'int', size: 11, comment: '更新时间' },
        { name: 'delete_time', type: 'int', size: 11, comment: '删除时间' }
      ],
      indexes: [
        { name: 'idx_order_id', type: 'INDEX', fields: ['order_id'] },
        { name: 'idx_user_id', type: 'INDEX', fields: ['user_id'] },
        { name: 'idx_goods_id', type: 'INDEX', fields: ['goods_id'] },
        { name: 'idx_status', type: 'INDEX', fields: ['status'] },
        { name: 'idx_create_time', type: 'INDEX', fields: ['create_time'] }
      ]
    }
  ],

  // 表关系定义
  relationships: [
    {
      id: 'user-order',
      fromTableId: 'box_user',
      toTableId: 'box_order',
      fromFieldId: 'id',
      toFieldId: 'user_id',
      type: 'ONE_TO_MANY',
      name: '用户-订单关系',
      description: '一个用户可以有多个盲盒订单'
    },
    {
      id: 'order-prize',
      fromTableId: 'box_order',
      toTableId: 'box_prize_record',
      fromFieldId: 'id',
      toFieldId: 'order_id',
      type: 'ONE_TO_MANY',
      name: '订单-中奖记录',
      description: '一个订单可以产生多个中奖记录(连抽)'
    },
    {
      id: 'boxfl-order',
      fromTableId: 'box_boxfl',
      toTableId: 'box_order',
      fromFieldId: 'id',
      toFieldId: 'boxfl_id',
      type: 'ONE_TO_MANY',
      name: '盲盒-订单关系',
      description: '一个盲盒配置对应多个购买订单'
    },
    {
      id: 'goods-prize',
      fromTableId: 'box_goods',
      toTableId: 'box_prize_record',
      fromFieldId: 'id',
      toFieldId: 'goods_id',
      type: 'ONE_TO_MANY',
      name: '商品-中奖记录',
      description: '一个商品可以在多次开盒中被抽中'
    },
    {
      id: 'user-agent-hierarchy',
      fromTableId: 'box_user',
      toTableId: 'box_user',
      fromFieldId: 'id',
      toFieldId: 'pid',
      type: 'ONE_TO_MANY',
      name: '用户分销层级',
      description: '用户之间的上下级分销关系'
    }
  ]
}

/**
 * 生成DevAPI Manager项目数据插入脚本
 */
function generateInsertionScripts() {
  const scripts = []
  
  // 1. 清理现有数据
  scripts.push(`-- Box盲盒商城系统数据导入脚本`)
  scripts.push(`-- 生成时间: ${new Date().toISOString()}`)
  scripts.push(`-- 描述: 将Box次元盲盒商城数据库结构转换为DevAPI Manager项目格式`)
  scripts.push(``)
  scripts.push(`-- 清理现有数据(可选)`)
  scripts.push(`-- DELETE FROM ProjectTable WHERE projectId IN (SELECT id FROM Project WHERE name LIKE '%Box次元%');`)
  scripts.push(`-- DELETE FROM Project WHERE name LIKE '%Box次元%';`)
  scripts.push(``)

  // 2. 插入项目信息
  const project = BOX_MALL_TO_DEVAPI_MAPPING.projects[0]
  scripts.push(`-- 插入项目信息`)
  scripts.push(`INSERT INTO Project (id, name, description, version, status, tags, createTime, updateTime) VALUES (`)
  scripts.push(`  '${project.id}',`)
  scripts.push(`  '${project.name}',`)
  scripts.push(`  '${project.description}',`)
  scripts.push(`  '${project.version}',`)
  scripts.push(`  '${project.status}',`)
  scripts.push(`  '${JSON.stringify(project.tags)}',`)
  scripts.push(`  '${project.createTime}',`)
  scripts.push(`  '${project.updateTime}'`)
  scripts.push(`);`)
  scripts.push(``)

  // 3. 插入分类信息
  scripts.push(`-- 插入表分类`)
  BOX_MALL_TO_DEVAPI_MAPPING.categories.forEach(category => {
    scripts.push(`INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (`)
    scripts.push(`  '${category.id}',`)
    scripts.push(`  '${project.id}',`)
    scripts.push(`  '${category.name}',`)
    scripts.push(`  '${category.color}',`)
    scripts.push(`  '${category.description}',`)
    scripts.push(`  '${new Date().toISOString()}',`)
    scripts.push(`  '${new Date().toISOString()}'`)
    scripts.push(`);`)
  })
  scripts.push(``)

  // 4. 插入表信息
  scripts.push(`-- 插入数据表信息`)
  BOX_MALL_TO_DEVAPI_MAPPING.tables.forEach((table, index) => {
    scripts.push(`-- ${index + 1}. ${table.displayName}`)
    scripts.push(`INSERT INTO DatabaseTable (`)
    scripts.push(`  id, projectId, name, displayName, description, comment, engine, charset, status, estimatedRows, createTime, updateTime`)
    scripts.push(`) VALUES (`)
    scripts.push(`  '${table.id}',`)
    scripts.push(`  '${project.id}',`)
    scripts.push(`  '${table.name}',`)
    scripts.push(`  '${table.displayName}',`)
    scripts.push(`  '${table.description}',`)
    scripts.push(`  '${table.comment}',`)
    scripts.push(`  '${table.engine}',`)
    scripts.push(`  '${table.charset}',`)
    scripts.push(`  '${table.status}',`)
    scripts.push(`  ${table.estimatedRows},`)
    scripts.push(`  '${new Date().toISOString()}',`)
    scripts.push(`  '${new Date().toISOString()}'`)
    scripts.push(`);`)
    scripts.push(``)

    // 插入字段信息
    table.fields.forEach((field, fieldIndex) => {
      const fieldId = `${table.id}_${field.name}`
      scripts.push(`INSERT INTO DatabaseField (`)
      scripts.push(`  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder`)
      scripts.push(`) VALUES (`)
      scripts.push(`  '${fieldId}',`)
      scripts.push(`  '${table.id}',`)
      scripts.push(`  '${field.name}',`)
      scripts.push(`  '${field.type}',`)
      scripts.push(`  '${field.size || ''}',`)
      scripts.push(`  ${field.notNull ? 'FALSE' : 'TRUE'},`)
      scripts.push(`  ${field.defaultValue ? `'${field.defaultValue}'` : 'NULL'},`)
      scripts.push(`  ${field.primaryKey ? 'TRUE' : 'FALSE'},`)
      scripts.push(`  ${field.autoIncrement ? 'TRUE' : 'FALSE'},`)
      scripts.push(`  '${field.comment}',`)
      scripts.push(`  ${fieldIndex + 1}`)
      scripts.push(`);`)
    })
    scripts.push(``)

    // 插入索引信息
    if (table.indexes && table.indexes.length > 0) {
      table.indexes.forEach(index => {
        const indexId = `${table.id}_${index.name}`
        scripts.push(`INSERT INTO DatabaseIndex (`)
        scripts.push(`  id, tableId, name, type, fields, isUnique, comment`)
        scripts.push(`) VALUES (`)
        scripts.push(`  '${indexId}',`)
        scripts.push(`  '${table.id}',`)
        scripts.push(`  '${index.name}',`)
        scripts.push(`  '${index.type}',`)
        scripts.push(`  '${JSON.stringify(index.fields)}',`)
        scripts.push(`  ${index.type === 'UNIQUE' ? 'TRUE' : 'FALSE'},`)
        scripts.push(`  '${index.comment || ''}'`)
        scripts.push(`);`)
      })
      scripts.push(``)
    }

    // 关联表标签
    scripts.push(`-- 关联表标签`)
    scripts.push(`INSERT INTO ProjectTable (projectId, tableId, categoryId) VALUES ('${project.id}', '${table.id}', '${table.categoryId}');`)
    scripts.push(``)
  })

  // 5. 插入关系信息
  scripts.push(`-- 插入表关系`)
  BOX_MALL_TO_DEVAPI_MAPPING.relationships.forEach(relationship => {
    scripts.push(`INSERT INTO DatabaseRelationship (`)
    scripts.push(`  id, projectId, fromTableId, toTableId, fromFieldId, toFieldId, type, name, description, createTime`)
    scripts.push(`) VALUES (`)
    scripts.push(`  '${relationship.id}',`)
    scripts.push(`  '${project.id}',`)
    scripts.push(`  '${relationship.fromTableId}',`)
    scripts.push(`  '${relationship.toTableId}',`)
    scripts.push(`  '${relationship.fromFieldId}',`)
    scripts.push(`  '${relationship.toFieldId}',`)
    scripts.push(`  '${relationship.type}',`)
    scripts.push(`  '${relationship.name}',`)
    scripts.push(`  '${relationship.description}',`)
    scripts.push(`  '${new Date().toISOString()}'`)
    scripts.push(`);`)
  })

  return scripts.join('\n')
}

/**
 * 生成思维导图布局数据
 */
function generateMindmapLayout() {
  const layout = {
    projectId: 'box-mall-system',
    layoutType: 'hierarchical',
    nodes: [],
    edges: [],
    config: {
      layout: { type: 'hierarchical', direction: 'TB' },
      display: { showLabels: true, compactMode: false },
      filters: { nodeTypes: ['project', 'category', 'table'], edgeTypes: ['hierarchy', 'foreignKey'] }
    }
  }

  // 项目根节点
  layout.nodes.push({
    id: 'project-root',
    type: 'project',
    position: { x: 400, y: 50 },
    data: {
      id: 'box-mall-system',
      name: 'Box次元盲盒商城',
      description: '综合性盲盒电商平台',
      nodeType: 'project'
    }
  })

  // 分类节点
  const categoryPositions = [
    { x: 100, y: 200 }, { x: 300, y: 200 }, { x: 500, y: 200 }, { x: 700, y: 200 }
  ]
  
  BOX_MALL_TO_DEVAPI_MAPPING.categories.slice(0, 4).forEach((category, index) => {
    layout.nodes.push({
      id: `category-${category.id}`,
      type: 'category',
      position: categoryPositions[index],
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        nodeType: 'category'
      }
    })

    // 项目到分类的边
    layout.edges.push({
      id: `edge-project-${category.id}`,
      source: 'project-root',
      target: `category-${category.id}`,
      type: 'hierarchy',
      data: { type: 'hierarchy', style: 'solid' }
    })
  })

  // 表节点
  let tableYOffset = 350
  BOX_MALL_TO_DEVAPI_MAPPING.tables.forEach((table, index) => {
    const categoryIndex = BOX_MALL_TO_DEVAPI_MAPPING.categories.findIndex(c => c.id === table.categoryId)
    const baseX = categoryPositions[categoryIndex % 4].x
    
    layout.nodes.push({
      id: `table-${table.id}`,
      type: 'table',
      position: { x: baseX + (index % 2) * 150 - 75, y: tableYOffset + Math.floor(index / 2) * 100 },
      data: {
        id: table.id,
        name: table.displayName,
        tableName: table.name,
        description: table.description,
        fieldCount: table.fields.length,
        status: table.status,
        nodeType: 'table'
      }
    })

    // 分类到表的边
    layout.edges.push({
      id: `edge-category-${table.id}`,
      source: `category-${table.categoryId}`,
      target: `table-${table.id}`,
      type: 'hierarchy',
      data: { type: 'hierarchy', style: 'solid' }
    })
  })

  // 关系边
  BOX_MALL_TO_DEVAPI_MAPPING.relationships.forEach(relationship => {
    layout.edges.push({
      id: `edge-rel-${relationship.id}`,
      source: `table-${relationship.fromTableId}`,
      target: `table-${relationship.toTableId}`,
      type: 'foreignKey',
      data: {
        type: 'foreignKey',
        style: 'dashed',
        label: relationship.name
      }
    })
  })

  return layout
}

/**
 * 主执行函数
 */
function main() {
  console.log('🚀 开始生成Box盲盒商城转换脚本...')
  
  try {
    // 生成插入脚本
    const insertScript = generateInsertionScripts()
    const scriptPath = path.join(__dirname, 'box-mall-insertion.sql')
    fs.writeFileSync(scriptPath, insertScript, 'utf8')
    console.log(`✅ 数据插入脚本已生成: ${scriptPath}`)

    // 生成思维导图数据
    const mindmapLayout = generateMindmapLayout()
    const mindmapPath = path.join(__dirname, 'box-mall-mindmap-layout.json')
    fs.writeFileSync(mindmapPath, JSON.stringify(mindmapLayout, null, 2), 'utf8')
    console.log(`✅ 思维导图布局已生成: ${mindmapPath}`)

    // 生成转换报告
    const report = generateConversionReport()
    const reportPath = path.join(__dirname, 'box-mall-conversion-report.md')
    fs.writeFileSync(reportPath, report, 'utf8')
    console.log(`✅ 转换报告已生成: ${reportPath}`)

    console.log('\n🎉 Box盲盒商城数据转换完成!')
    console.log('\n📋 生成的文件:')
    console.log(`   1. ${scriptPath} - 数据库插入脚本`)
    console.log(`   2. ${mindmapPath} - 思维导图布局数据`)
    console.log(`   3. ${reportPath} - 转换详细报告`)

  } catch (error) {
    console.error('❌ 转换过程中发生错误:', error)
    process.exit(1)
  }
}

/**
 * 生成转换报告
 */
function generateConversionReport() {
  const report = []
  report.push('# Box次元盲盒商城系统转换报告')
  report.push('')
  report.push(`**转换时间**: ${new Date().toISOString()}`)
  report.push(`**源系统**: Box_Mall.sql (118 tables)`)
  report.push(`**目标系统**: DevAPI Manager`)
  report.push(`**转换范围**: 核心业务表 (${BOX_MALL_TO_DEVAPI_MAPPING.tables.length} tables)`)
  report.push('')

  report.push('## 项目概述')
  const project = BOX_MALL_TO_DEVAPI_MAPPING.projects[0]
  report.push(`- **项目名称**: ${project.name}`)
  report.push(`- **项目ID**: ${project.id}`)
  report.push(`- **描述**: ${project.description}`)
  report.push(`- **标签**: ${project.tags.join(', ')}`)
  report.push('')

  report.push('## 表分类结构')
  BOX_MALL_TO_DEVAPI_MAPPING.categories.forEach(category => {
    const tableCount = BOX_MALL_TO_DEVAPI_MAPPING.tables.filter(t => t.categoryId === category.id).length
    report.push(`### ${category.name} (${tableCount}张表)`)
    report.push(`- **分类ID**: ${category.id}`)
    report.push(`- **颜色**: ${category.color}`)
    report.push(`- **描述**: ${category.description}`)
    report.push('')
  })

  report.push('## 核心表转换详情')
  BOX_MALL_TO_DEVAPI_MAPPING.tables.forEach(table => {
    report.push(`### ${table.displayName} (${table.name})`)
    report.push(`- **表ID**: ${table.id}`)
    report.push(`- **分类**: ${BOX_MALL_TO_DEVAPI_MAPPING.categories.find(c => c.id === table.categoryId)?.name}`)
    report.push(`- **字段数**: ${table.fields.length}`)
    report.push(`- **索引数**: ${table.indexes?.length || 0}`)
    report.push(`- **预估数据量**: ${table.estimatedRows.toLocaleString()} 行`)
    report.push(`- **描述**: ${table.description}`)
    report.push('')
  })

  report.push('## 表关系映射')
  BOX_MALL_TO_DEVAPI_MAPPING.relationships.forEach(rel => {
    report.push(`### ${rel.name}`)
    report.push(`- **关系ID**: ${rel.id}`)
    report.push(`- **类型**: ${rel.type}`)
    report.push(`- **从表**: ${rel.fromTableId} (${rel.fromFieldId})`)
    report.push(`- **到表**: ${rel.toTableId} (${rel.toFieldId})`)
    report.push(`- **描述**: ${rel.description}`)
    report.push('')
  })

  report.push('## 转换统计')
  report.push(`- **项目数**: ${BOX_MALL_TO_DEVAPI_MAPPING.projects.length}`)
  report.push(`- **分类数**: ${BOX_MALL_TO_DEVAPI_MAPPING.categories.length}`)
  report.push(`- **表数**: ${BOX_MALL_TO_DEVAPI_MAPPING.tables.length}`)
  report.push(`- **字段数**: ${BOX_MALL_TO_DEVAPI_MAPPING.tables.reduce((sum, t) => sum + t.fields.length, 0)}`)
  report.push(`- **关系数**: ${BOX_MALL_TO_DEVAPI_MAPPING.relationships.length}`)
  report.push('')

  report.push('## 特色功能说明')
  report.push('1. **多层级分销系统**: 支持二级分销，自动计算返佣')
  report.push('2. **盲盒抽奖机制**: 四级概率控制，连抽优惠，锁盒功能')
  report.push('3. **多种支付方式**: 微信、支付宝、余额、虚拟货币')
  report.push('4. **会员权益体系**: VIP会员、等级权限、积分系统')
  report.push('5. **社交互动功能**: 赠送、分享、社区内容')
  report.push('6. **完整物流管理**: 预售、发货、收货全流程')
  report.push('')

  report.push('## 使用说明')
  report.push('1. 执行 `box-mall-insertion.sql` 脚本导入数据到 DevAPI Manager')
  report.push('2. 将 `box-mall-mindmap-layout.json` 导入思维导图功能')
  report.push('3. 根据需要调整表结构和关系配置')
  report.push('4. 可参考此项目结构设计类似的电商游戏化平台')

  return report.join('\n')
}

// 如果直接运行此脚本则执行main函数
if (require.main === module) {
  main()
}

module.exports = {
  BOX_MALL_TO_DEVAPI_MAPPING,
  generateInsertionScripts,
  generateMindmapLayout,
  generateConversionReport
}