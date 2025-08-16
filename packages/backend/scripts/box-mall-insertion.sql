-- Box盲盒商城系统数据导入脚本
-- 生成时间: 2025-08-15T20:50:06.713Z
-- 描述: 将Box次元盲盒商城数据库结构转换为DevAPI Manager项目格式

-- 清理现有数据(可选)
-- DELETE FROM ProjectTable WHERE projectId IN (SELECT id FROM Project WHERE name LIKE '%Box次元%');
-- DELETE FROM Project WHERE name LIKE '%Box次元%';

-- 插入项目信息
INSERT INTO Project (id, name, description, version, status, tags, createTime, updateTime) VALUES (
  'box-mall-system',
  'Box次元盲盒商城系统',
  '一个集成电商、游戏、社交功能的综合性盲盒平台，支持多级分销、概率抽奖、会员体系等核心功能',
  '1.0.0',
  'ACTIVE',
  '["电商","游戏化","社交","分销","盲盒"]',
  '2025-08-15T20:50:06.709Z',
  '2025-08-15T20:50:06.710Z'
);

-- 插入表分类
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'user-management',
  'box-mall-system',
  '用户管理模块',
  '#3B82F6',
  '用户注册、认证、权限、会员等功能',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'product-catalog',
  'box-mall-system',
  '商品目录管理',
  '#10B981',
  '商品分类、库存、价格、盲盒配置等',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'order-transaction',
  'box-mall-system',
  '订单交易系统',
  '#F59E0B',
  '订单流程、支付处理、物流管理等',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'gaming-rewards',
  'box-mall-system',
  '游戏奖励机制',
  '#8B5CF6',
  '盲盒抽奖、概率控制、奖品管理等',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'social-community',
  'box-mall-system',
  '社交社区功能',
  '#EF4444',
  '用户互动、内容分享、关注系统等',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'financial-commission',
  'box-mall-system',
  '财务佣金体系',
  '#06B6D4',
  '分销返佣、提现管理、财务记录等',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);
INSERT INTO Tag (id, projectId, name, color, description, createTime, updateTime) VALUES (
  'system-config',
  'box-mall-system',
  '系统配置管理',
  '#84CC16',
  '平台设置、后台管理、系统配置等',
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);

-- 插入数据表信息
-- 1. 用户信息表
INSERT INTO DatabaseTable (
  id, projectId, name, displayName, description, comment, engine, charset, status, estimatedRows, createTime, updateTime
) VALUES (
  'box_user',
  'box-mall-system',
  'box_user',
  '用户信息表',
  '核心用户表，包含注册信息、财务状态、会员等级、分销关系等完整用户数据',
  '支持多平台登录(微信/APP/H5)，包含VIP会员、分销代理、财务余额等功能',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  9000,
  '2025-08-15T20:50:06.713Z',
  '2025-08-15T20:50:06.713Z'
);

INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_id',
  'box_user',
  'id',
  'int',
  '11',
  TRUE,
  NULL,
  TRUE,
  TRUE,
  '用户ID主键',
  1
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_group_id',
  'box_user',
  'group_id',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '用户组别ID',
  2
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_username',
  'box_user',
  'username',
  'varchar',
  '32',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '用户名',
  3
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_nickname',
  'box_user',
  'nickname',
  'varchar',
  '50',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '用户昵称',
  4
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_password',
  'box_user',
  'password',
  'varchar',
  '32',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '密码(MD5)',
  5
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_salt',
  'box_user',
  'salt',
  'varchar',
  '30',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '密码盐值',
  6
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_email',
  'box_user',
  'email',
  'varchar',
  '100',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '邮箱地址',
  7
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_mobile',
  'box_user',
  'mobile',
  'varchar',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '手机号码',
  8
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_avatar',
  'box_user',
  'avatar',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '头像URL',
  9
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_level',
  'box_user',
  'level',
  'tinyint',
  '3',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '用户等级',
  10
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_gender',
  'box_user',
  'gender',
  'tinyint',
  '3',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '性别:0=未知,1=男,2=女',
  11
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_birthday',
  'box_user',
  'birthday',
  'date',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '生日',
  12
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_money',
  'box_user',
  'money',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '烛星石余额',
  13
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_balance',
  'box_user',
  'balance',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '账户余额',
  14
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_score',
  'box_user',
  'score',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '积分',
  15
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_invitation',
  'box_user',
  'invitation',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '邀请码',
  16
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_pid',
  'box_user',
  'pid',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '上级用户ID(分销关系)',
  17
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_wx_mini_openid',
  'box_user',
  'wx_mini_openid',
  'varchar',
  '50',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '微信小程序OpenID',
  18
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_wx_app_openid',
  'box_user',
  'wx_app_openid',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '微信APP OpenID',
  19
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_unionid',
  'box_user',
  'unionid',
  'varchar',
  '50',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '微信UnionID',
  20
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_agent',
  'box_user',
  'agent',
  'tinyint',
  '1',
  TRUE,
  '2',
  FALSE,
  FALSE,
  '分销员状态:1=是,2=否',
  21
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_agent_lev_id',
  'box_user',
  'agent_lev_id',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '分销等级ID',
  22
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_wallet_left',
  'box_user',
  'wallet_left',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '可用佣金',
  23
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_wallet_tx',
  'box_user',
  'wallet_tx',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '已提现佣金',
  24
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_vip_end_time',
  'box_user',
  'vip_end_time',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  'VIP到期时间',
  25
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_total_consume',
  'box_user',
  'total_consume',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '累计消费金额',
  26
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_status',
  'box_user',
  'status',
  'varchar',
  '30',
  TRUE,
  'normal',
  FALSE,
  FALSE,
  '用户状态',
  27
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_logintime',
  'box_user',
  'logintime',
  'bigint',
  '20',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '最后登录时间',
  28
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_loginip',
  'box_user',
  'loginip',
  'varchar',
  '50',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '最后登录IP',
  29
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_createtime',
  'box_user',
  'createtime',
  'bigint',
  '20',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '注册时间',
  30
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_user_updatetime',
  'box_user',
  'updatetime',
  'bigint',
  '20',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '更新时间',
  31
);

INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_user_idx_username',
  'box_user',
  'idx_username',
  'INDEX',
  '["username"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_user_idx_mobile',
  'box_user',
  'idx_mobile',
  'INDEX',
  '["mobile"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_user_idx_email',
  'box_user',
  'idx_email',
  'INDEX',
  '["email"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_user_idx_invitation',
  'box_user',
  'idx_invitation',
  'INDEX',
  '["invitation"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_user_idx_wx_mini_openid',
  'box_user',
  'idx_wx_mini_openid',
  'INDEX',
  '["wx_mini_openid"]',
  FALSE,
  ''
);

-- 关联表标签
INSERT INTO ProjectTable (projectId, tableId, categoryId) VALUES ('box-mall-system', 'box_user', 'user-management');

-- 2. 商品信息表
INSERT INTO DatabaseTable (
  id, projectId, name, displayName, description, comment, engine, charset, status, estimatedRows, createTime, updateTime
) VALUES (
  'box_goods',
  'box-mall-system',
  'box_goods',
  '商品信息表',
  '商城商品目录表，支持实物和虚拟商品，包含价格体系、库存管理、分销配置等',
  '支持RMB和幸运币双币种定价，预售功能，分销返佣设置',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  2000,
  '2025-08-15T20:50:06.714Z',
  '2025-08-15T20:50:06.714Z'
);

INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_id',
  'box_goods',
  'id',
  'int',
  '11',
  TRUE,
  NULL,
  TRUE,
  TRUE,
  '商品ID',
  1
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_goodcategory_id',
  'box_goods',
  'goodcategory_id',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '商品分类ID',
  2
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_goods_name',
  'box_goods',
  'goods_name',
  'varchar',
  '255',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '商品名称',
  3
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_price',
  'box_goods',
  'price',
  'decimal',
  '10,2',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '人民币价格',
  4
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_c_price',
  'box_goods',
  'c_price',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '幸运币价格',
  5
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_stock',
  'box_goods',
  'stock',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '库存数量',
  6
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_good_images',
  'box_goods',
  'good_images',
  'text',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '商品图片(JSON数组)',
  7
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_gooddetails',
  'box_goods',
  'gooddetails',
  'text',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '商品详情HTML',
  8
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_freight',
  'box_goods',
  'freight',
  'decimal',
  '8,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '运费',
  9
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_type',
  'box_goods',
  'type',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '商品类型:0=实物,1=虚拟',
  10
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_goods_switch',
  'box_goods',
  'goods_switch',
  'tinyint',
  '1',
  TRUE,
  '1',
  FALSE,
  FALSE,
  '商品状态:0=下架,1=上架',
  11
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_sort',
  'box_goods',
  'sort',
  'int',
  '11',
  TRUE,
  '99',
  FALSE,
  FALSE,
  '排序权重',
  12
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_box_goods_switch',
  'box_goods',
  'box_goods_switch',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '盲盒商品库:0=隐藏,1=显示',
  13
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_is_presale',
  'box_goods',
  'is_presale',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '预售状态:0=否,1=是',
  14
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_delivery_date',
  'box_goods',
  'delivery_date',
  'date',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '预计发货日期',
  15
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_goodscode',
  'box_goods',
  'goodscode',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '商品编码',
  16
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_luckycoin',
  'box_goods',
  'luckycoin',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '兑换获得幸运币',
  17
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_agent',
  'box_goods',
  'agent',
  'tinyint',
  '1',
  TRUE,
  '2',
  FALSE,
  FALSE,
  '参与分销:1=是,2=否',
  18
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_agent_lev1',
  'box_goods',
  'agent_lev1',
  'decimal',
  '5,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '一级分销比例%',
  19
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_goods_agent_lev2',
  'box_goods',
  'agent_lev2',
  'decimal',
  '5,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '二级分销比例%',
  20
);

INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_goods_idx_category',
  'box_goods',
  'idx_category',
  'INDEX',
  '["goodcategory_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_goods_idx_status',
  'box_goods',
  'idx_status',
  'INDEX',
  '["goods_switch"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_goods_idx_sort',
  'box_goods',
  'idx_sort',
  'INDEX',
  '["sort"]',
  FALSE,
  ''
);

-- 关联表标签
INSERT INTO ProjectTable (projectId, tableId, categoryId) VALUES ('box-mall-system', 'box_goods', 'product-catalog');

-- 3. 盲盒配置表
INSERT INTO DatabaseTable (
  id, projectId, name, displayName, description, comment, engine, charset, status, estimatedRows, createTime, updateTime
) VALUES (
  'box_boxfl',
  'box-mall-system',
  'box_boxfl',
  '盲盒配置表',
  '盲盒核心配置表，包含概率设置、价格策略、限购规则、特殊玩法等游戏机制',
  '支持无限赏和一番赏两种模式，四级概率控制，连抽优惠，会员特权等',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  127,
  '2025-08-15T20:50:06.714Z',
  '2025-08-15T20:50:06.714Z'
);

INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_id',
  'box_boxfl',
  'id',
  'int',
  '11',
  TRUE,
  NULL,
  TRUE,
  TRUE,
  '盲盒ID',
  1
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_game_type',
  'box_boxfl',
  'game_type',
  'enum',
  '',
  TRUE,
  'unend',
  FALSE,
  FALSE,
  '游戏类型:unend=无限赏,limit=一番赏',
  2
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_name',
  'box_boxfl',
  'box_name',
  'varchar',
  '255',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '盲盒名称',
  3
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_cate_id',
  'box_boxfl',
  'box_cate_id',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '盲盒分类ID',
  4
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_banner_images',
  'box_boxfl',
  'box_banner_images',
  'text',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '首页轮播图(JSON)',
  5
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_foot_images',
  'box_boxfl',
  'box_foot_images',
  'text',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '底部展示图(JSON)',
  6
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_label',
  'box_boxfl',
  'box_label',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '盲盒标签',
  7
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_label2',
  'box_boxfl',
  'box_label2',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '盲盒副标签',
  8
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_price',
  'box_boxfl',
  'price',
  'decimal',
  '8,2',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '单抽价格',
  9
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_probability_gj',
  'box_boxfl',
  'probability_gj',
  'decimal',
  '5,2',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '高级商品概率%',
  10
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_probability_xy',
  'box_boxfl',
  'probability_xy',
  'decimal',
  '5,2',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '稀有商品概率%',
  11
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_probability_ss',
  'box_boxfl',
  'probability_ss',
  'decimal',
  '5,2',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '史诗商品概率%',
  12
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_probability_cs',
  'box_boxfl',
  'probability_cs',
  'decimal',
  '5,2',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '传说商品概率%',
  13
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_boxswitch',
  'box_boxfl',
  'boxswitch',
  'tinyint',
  '1',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '盲盒开关:0=关闭,1=开启',
  14
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_first_order_discount',
  'box_boxfl',
  'first_order_discount',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '新人首单优惠:0=否,1=是',
  15
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_sort',
  'box_boxfl',
  'sort',
  'int',
  '11',
  TRUE,
  '99',
  FALSE,
  FALSE,
  '排序权重',
  16
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_5times_draw',
  'box_boxfl',
  '5times_draw',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '5抽必中商品ID列表',
  17
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_10times_draw',
  'box_boxfl',
  '10times_draw',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '10抽必中商品ID列表',
  18
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_lcyhbl',
  'box_boxfl',
  'lcyhbl',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '连抽优惠比例%',
  19
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_lcyhjg',
  'box_boxfl',
  'lcyhjg',
  'decimal',
  '8,2',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '连抽优惠价格',
  20
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_five_vip_days',
  'box_boxfl',
  'five_vip_days',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '5抽赠送VIP天数',
  21
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_ten_vip_days',
  'box_boxfl',
  'ten_vip_days',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '10抽赠送VIP天数',
  22
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_buy_limit',
  'box_boxfl',
  'buy_limit',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '每日限购次数',
  23
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_buy_limit_price',
  'box_boxfl',
  'buy_limit_price',
  'decimal',
  '10,2',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '解锁限购消费门槛',
  24
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_first_price',
  'box_boxfl',
  'first_price',
  'decimal',
  '8,2',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '首单特价',
  25
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_is_free',
  'box_boxfl',
  'is_free',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '免费抽取:0=否,1=是',
  26
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_box_num',
  'box_boxfl',
  'box_num',
  'int',
  '11',
  TRUE,
  '1',
  FALSE,
  FALSE,
  '开启箱数',
  27
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_lock_status',
  'box_boxfl',
  'lock_status',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '锁盒功能:0=关闭,1=开启',
  28
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_show_index',
  'box_boxfl',
  'show_index',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '首页展示:0=否,1=是',
  29
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_agent',
  'box_boxfl',
  'agent',
  'tinyint',
  '1',
  TRUE,
  '2',
  FALSE,
  FALSE,
  '参与分销:1=是,2=否',
  30
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_agent_lev1',
  'box_boxfl',
  'agent_lev1',
  'decimal',
  '5,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '一级分销比例%',
  31
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_agent_lev2',
  'box_boxfl',
  'agent_lev2',
  'decimal',
  '5,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '二级分销比例%',
  32
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_fragment_mode',
  'box_boxfl',
  'fragment_mode',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '碎片模式:0=关闭,1=开启',
  33
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_fragment_cost',
  'box_boxfl',
  'fragment_cost',
  'decimal',
  '8,2',
  TRUE,
  '9.90',
  FALSE,
  FALSE,
  '碎片模式费用',
  34
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_boxfl_is_del',
  'box_boxfl',
  'is_del',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '删除状态:0=正常,1=删除',
  35
);

INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_boxfl_idx_category',
  'box_boxfl',
  'idx_category',
  'INDEX',
  '["box_cate_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_boxfl_idx_status',
  'box_boxfl',
  'idx_status',
  'INDEX',
  '["boxswitch"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_boxfl_idx_sort',
  'box_boxfl',
  'idx_sort',
  'INDEX',
  '["sort"]',
  FALSE,
  ''
);

-- 关联表标签
INSERT INTO ProjectTable (projectId, tableId, categoryId) VALUES ('box-mall-system', 'box_boxfl', 'gaming-rewards');

-- 4. 盲盒订单表
INSERT INTO DatabaseTable (
  id, projectId, name, displayName, description, comment, engine, charset, status, estimatedRows, createTime, updateTime
) VALUES (
  'box_order',
  'box-mall-system',
  'box_order',
  '盲盒订单表',
  '盲盒购买订单核心表，支持多种支付方式、优惠券、代付、送礼等功能',
  '完整的订单生命周期管理，包含支付、开盒、分销、礼品功能',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  3600,
  '2025-08-15T20:50:06.714Z',
  '2025-08-15T20:50:06.714Z'
);

INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_id',
  'box_order',
  'id',
  'int',
  '11',
  TRUE,
  NULL,
  TRUE,
  TRUE,
  '订单ID',
  1
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_boxfl_id',
  'box_order',
  'boxfl_id',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '盲盒ID',
  2
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_boxfl_name',
  'box_order',
  'boxfl_name',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '盲盒名称',
  3
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_image',
  'box_order',
  'image',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '盲盒主图',
  4
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_user_id',
  'box_order',
  'user_id',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '购买用户ID',
  5
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_pay_method',
  'box_order',
  'pay_method',
  'enum',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '支付方式',
  6
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_total_fee',
  'box_order',
  'total_fee',
  'decimal',
  '10,2',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '订单原价',
  7
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_xingshi',
  'box_order',
  'xingshi',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '星石抵扣金额',
  8
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_coupon_fee',
  'box_order',
  'coupon_fee',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '优惠券抵扣',
  9
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_pay_coin',
  'box_order',
  'pay_coin',
  'decimal',
  '10,2',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '实际支付金额',
  10
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_out_trade_no',
  'box_order',
  'out_trade_no',
  'varchar',
  '100',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '商户订单号',
  11
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_transaction_id',
  'box_order',
  'transaction_id',
  'varchar',
  '100',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '第三方交易号',
  12
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_pay_time',
  'box_order',
  'pay_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '支付时间',
  13
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_status',
  'box_order',
  'status',
  'enum',
  '',
  TRUE,
  'unpay',
  FALSE,
  FALSE,
  '订单状态',
  14
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_num',
  'box_order',
  'num',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '购买数量',
  15
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_delivery_fee',
  'box_order',
  'delivery_fee',
  'decimal',
  '8,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '运费',
  16
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_ischou',
  'box_order',
  'ischou',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '是否已抽奖:0=否,1=是',
  17
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_open_time',
  'box_order',
  'open_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '开盒时间',
  18
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_gift_status',
  'box_order',
  'gift_status',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '送礼状态:0=无,1=待领取,2=已领取',
  19
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_gift_send_uid',
  'box_order',
  'gift_send_uid',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '赠送对象用户ID',
  20
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_gift_receive_time',
  'box_order',
  'gift_receive_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '礼物领取时间',
  21
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_is_behalf_pay',
  'box_order',
  'is_behalf_pay',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '代付订单:0=否,1=是',
  22
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_behalf_uid',
  'box_order',
  'behalf_uid',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '代付人ID',
  23
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_agent_lev1_uid',
  'box_order',
  'agent_lev1_uid',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '一级分销用户ID',
  24
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_agent_lev1_percent',
  'box_order',
  'agent_lev1_percent',
  'decimal',
  '5,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '一级分销比例%',
  25
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_agent_lev1_price',
  'box_order',
  'agent_lev1_price',
  'decimal',
  '8,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '一级分销佣金',
  26
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_agent_lev2_uid',
  'box_order',
  'agent_lev2_uid',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '二级分销用户ID',
  27
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_agent_lev2_percent',
  'box_order',
  'agent_lev2_percent',
  'decimal',
  '5,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '二级分销比例%',
  28
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_agent_lev2_price',
  'box_order',
  'agent_lev2_price',
  'decimal',
  '8,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '二级分销佣金',
  29
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_fragment_mode',
  'box_order',
  'fragment_mode',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '碎片模式:0=否,1=是',
  30
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_fragment_results',
  'box_order',
  'fragment_results',
  'text',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '碎片抽取结果(JSON)',
  31
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_terminal',
  'box_order',
  'terminal',
  'tinyint',
  '1',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '下单终端:0=H5,1=小程序,2=APP',
  32
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_create_time',
  'box_order',
  'create_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '创建时间',
  33
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_update_time',
  'box_order',
  'update_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '更新时间',
  34
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_order_delete_time',
  'box_order',
  'delete_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '删除时间',
  35
);

INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_order_idx_out_trade_no',
  'box_order',
  'idx_out_trade_no',
  'UNIQUE',
  '["out_trade_no"]',
  TRUE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_order_idx_user_id',
  'box_order',
  'idx_user_id',
  'INDEX',
  '["user_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_order_idx_boxfl_id',
  'box_order',
  'idx_boxfl_id',
  'INDEX',
  '["boxfl_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_order_idx_status',
  'box_order',
  'idx_status',
  'INDEX',
  '["status"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_order_idx_pay_time',
  'box_order',
  'idx_pay_time',
  'INDEX',
  '["pay_time"]',
  FALSE,
  ''
);

-- 关联表标签
INSERT INTO ProjectTable (projectId, tableId, categoryId) VALUES ('box-mall-system', 'box_order', 'order-transaction');

-- 5. 中奖记录表
INSERT INTO DatabaseTable (
  id, projectId, name, displayName, description, comment, engine, charset, status, estimatedRows, createTime, updateTime
) VALUES (
  'box_prize_record',
  'box-mall-system',
  'box_prize_record',
  '中奖记录表',
  '用户开盒中奖记录表，包含奖品信息、状态流转、物流处理等完整生命周期',
  '支持多种奖品来源，完整的奖品状态管理，社交赠送功能',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  11500,
  '2025-08-15T20:50:06.714Z',
  '2025-08-15T20:50:06.714Z'
);

INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_id',
  'box_prize_record',
  'id',
  'int',
  '11',
  TRUE,
  NULL,
  TRUE,
  TRUE,
  '记录ID',
  1
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_boxfl_id',
  'box_prize_record',
  'boxfl_id',
  'int',
  '11',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '盲盒ID',
  2
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_order_id',
  'box_prize_record',
  'order_id',
  'varchar',
  '255',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '关联订单ID',
  3
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_out_trade_no',
  'box_prize_record',
  'out_trade_no',
  'varchar',
  '100',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '商户订单号',
  4
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_user_id',
  'box_prize_record',
  'user_id',
  'int',
  '11',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '中奖用户ID',
  5
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_goods_id',
  'box_prize_record',
  'goods_id',
  'int',
  '11',
  FALSE,
  NULL,
  FALSE,
  FALSE,
  '奖品商品ID',
  6
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_goods_name',
  'box_prize_record',
  'goods_name',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '奖品名称',
  7
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_goods_image',
  'box_prize_record',
  'goods_image',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '奖品图片',
  8
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_goods_coin_price',
  'box_prize_record',
  'goods_coin_price',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '奖品幸运币价值',
  9
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_goods_rmb_price',
  'box_prize_record',
  'goods_rmb_price',
  'decimal',
  '10,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '奖品RMB价值',
  10
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_status',
  'box_prize_record',
  'status',
  'enum',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '奖品状态',
  11
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_tag',
  'box_prize_record',
  'tag',
  'enum',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '奖品稀有度',
  12
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_source',
  'box_prize_record',
  'source',
  'enum',
  '',
  TRUE,
  'mh',
  FALSE,
  FALSE,
  '奖品来源',
  13
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_exchange_time',
  'box_prize_record',
  'exchange_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '回收时间',
  14
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_delivery_time',
  'box_prize_record',
  'delivery_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '发货时间',
  15
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_delivery_fee',
  'box_prize_record',
  'delivery_fee',
  'decimal',
  '8,2',
  TRUE,
  '0.00',
  FALSE,
  FALSE,
  '运费',
  16
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_to_user_id',
  'box_prize_record',
  'to_user_id',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '赠送目标用户ID',
  17
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_from_user_id',
  'box_prize_record',
  'from_user_id',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '赠送来源用户ID',
  18
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_send_time',
  'box_prize_record',
  'send_time',
  'int',
  '11',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '赠送时间',
  19
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_is_presale',
  'box_prize_record',
  'is_presale',
  'tinyint',
  '1',
  TRUE,
  '0',
  FALSE,
  FALSE,
  '预售商品:0=否,1=是',
  20
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_delivery_date',
  'box_prize_record',
  'delivery_date',
  'date',
  '',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '预计发货日期',
  21
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_box_num_no',
  'box_prize_record',
  'box_num_no',
  'int',
  '11',
  TRUE,
  '1',
  FALSE,
  FALSE,
  '箱次编号',
  22
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_memo',
  'box_prize_record',
  'memo',
  'varchar',
  '255',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '备注信息',
  23
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_create_time',
  'box_prize_record',
  'create_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '中奖时间',
  24
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_update_time',
  'box_prize_record',
  'update_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '更新时间',
  25
);
INSERT INTO DatabaseField (
  id, tableId, name, type, size, nullable, defaultValue, isPrimaryKey, isAutoIncrement, comment, sortOrder
) VALUES (
  'box_prize_record_delete_time',
  'box_prize_record',
  'delete_time',
  'int',
  '11',
  TRUE,
  NULL,
  FALSE,
  FALSE,
  '删除时间',
  26
);

INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_prize_record_idx_order_id',
  'box_prize_record',
  'idx_order_id',
  'INDEX',
  '["order_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_prize_record_idx_user_id',
  'box_prize_record',
  'idx_user_id',
  'INDEX',
  '["user_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_prize_record_idx_goods_id',
  'box_prize_record',
  'idx_goods_id',
  'INDEX',
  '["goods_id"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_prize_record_idx_status',
  'box_prize_record',
  'idx_status',
  'INDEX',
  '["status"]',
  FALSE,
  ''
);
INSERT INTO DatabaseIndex (
  id, tableId, name, type, fields, isUnique, comment
) VALUES (
  'box_prize_record_idx_create_time',
  'box_prize_record',
  'idx_create_time',
  'INDEX',
  '["create_time"]',
  FALSE,
  ''
);

-- 关联表标签
INSERT INTO ProjectTable (projectId, tableId, categoryId) VALUES ('box-mall-system', 'box_prize_record', 'gaming-rewards');

-- 插入表关系
INSERT INTO DatabaseRelationship (
  id, projectId, fromTableId, toTableId, fromFieldId, toFieldId, type, name, description, createTime
) VALUES (
  'user-order',
  'box-mall-system',
  'box_user',
  'box_order',
  'id',
  'user_id',
  'ONE_TO_MANY',
  '用户-订单关系',
  '一个用户可以有多个盲盒订单',
  '2025-08-15T20:50:06.714Z'
);
INSERT INTO DatabaseRelationship (
  id, projectId, fromTableId, toTableId, fromFieldId, toFieldId, type, name, description, createTime
) VALUES (
  'order-prize',
  'box-mall-system',
  'box_order',
  'box_prize_record',
  'id',
  'order_id',
  'ONE_TO_MANY',
  '订单-中奖记录',
  '一个订单可以产生多个中奖记录(连抽)',
  '2025-08-15T20:50:06.714Z'
);
INSERT INTO DatabaseRelationship (
  id, projectId, fromTableId, toTableId, fromFieldId, toFieldId, type, name, description, createTime
) VALUES (
  'boxfl-order',
  'box-mall-system',
  'box_boxfl',
  'box_order',
  'id',
  'boxfl_id',
  'ONE_TO_MANY',
  '盲盒-订单关系',
  '一个盲盒配置对应多个购买订单',
  '2025-08-15T20:50:06.714Z'
);
INSERT INTO DatabaseRelationship (
  id, projectId, fromTableId, toTableId, fromFieldId, toFieldId, type, name, description, createTime
) VALUES (
  'goods-prize',
  'box-mall-system',
  'box_goods',
  'box_prize_record',
  'id',
  'goods_id',
  'ONE_TO_MANY',
  '商品-中奖记录',
  '一个商品可以在多次开盒中被抽中',
  '2025-08-15T20:50:06.714Z'
);
INSERT INTO DatabaseRelationship (
  id, projectId, fromTableId, toTableId, fromFieldId, toFieldId, type, name, description, createTime
) VALUES (
  'user-agent-hierarchy',
  'box-mall-system',
  'box_user',
  'box_user',
  'id',
  'pid',
  'ONE_TO_MANY',
  '用户分销层级',
  '用户之间的上下级分销关系',
  '2025-08-15T20:50:06.714Z'
);