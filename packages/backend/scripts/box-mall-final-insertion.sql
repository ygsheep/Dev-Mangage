-- Box盲盒商城系统数据导入脚本 (最终版)
-- 生成时间: 2025-08-15
-- 基于实际Prisma schema结构

-- 插入项目信息
INSERT INTO projects (id, name, description, status, createdAt, updatedAt) VALUES (
  'box-mall-system',
  'Box次元盲盒商城系统',
  '一个集成电商、游戏、社交功能的综合性盲盒平台，支持多级分销、概率抽奖、会员体系等核心功能',
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 插入表分类标签
INSERT INTO tags (id, projectId, name, color, createdAt) VALUES 
('user-management-tag', 'box-mall-system', '用户管理模块', '#3B82F6', CURRENT_TIMESTAMP),
('product-catalog-tag', 'box-mall-system', '商品目录管理', '#10B981', CURRENT_TIMESTAMP),
('order-transaction-tag', 'box-mall-system', '订单交易系统', '#F59E0B', CURRENT_TIMESTAMP),
('gaming-rewards-tag', 'box-mall-system', '游戏奖励机制', '#8B5CF6', CURRENT_TIMESTAMP),
('social-community-tag', 'box-mall-system', '社交社区功能', '#EF4444', CURRENT_TIMESTAMP),
('financial-commission-tag', 'box-mall-system', '财务佣金体系', '#06B6D4', CURRENT_TIMESTAMP),
('system-config-tag', 'box-mall-system', '系统配置管理', '#84CC16', CURRENT_TIMESTAMP);

-- 插入数据表信息

-- 1. 用户信息表 (box_user)
INSERT INTO database_tables (
  id, projectId, name, displayName, comment, engine, charset, status, category, createdAt, updatedAt
) VALUES (
  'box_user',
  'box-mall-system',
  'box_user',
  '用户信息表',
  '核心用户表，包含注册信息、财务状态、会员等级、分销关系等完整用户数据。支持多平台登录(微信/APP/H5)，包含VIP会员、分销代理、财务余额等功能',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  'user-management',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 用户表字段定义
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_user_id', 'box_user', 'id', 'int', '11', 0, 1, 1, '用户ID主键', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_group_id', 'box_user', 'group_id', 'int', '11', 1, 0, 0, '用户组别ID', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_username', 'box_user', 'username', 'varchar', '32', 1, 0, 0, '用户名', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_nickname', 'box_user', 'nickname', 'varchar', '50', 1, 0, 0, '用户昵称', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_password', 'box_user', 'password', 'varchar', '32', 1, 0, 0, '密码(MD5)', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_email', 'box_user', 'email', 'varchar', '100', 1, 0, 0, '邮箱地址', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_mobile', 'box_user', 'mobile', 'varchar', '11', 1, 0, 0, '手机号码', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_avatar', 'box_user', 'avatar', 'varchar', '255', 1, 0, 0, '头像URL', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_level', 'box_user', 'level', 'tinyint', '3', 1, 0, 0, '用户等级', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_money', 'box_user', 'money', 'decimal', '10,2', 1, 0, 0, '烛星石余额', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_balance', 'box_user', 'balance', 'decimal', '10,2', 1, 0, 0, '账户余额', 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_agent', 'box_user', 'agent', 'tinyint', '1', 1, 0, 0, '分销员状态:1=是,2=否', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_vip_end_time', 'box_user', 'vip_end_time', 'int', '11', 1, 0, 0, 'VIP到期时间', 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_status', 'box_user', 'status', 'varchar', '30', 1, 0, 0, '用户状态', 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_createdAt', 'box_user', 'createtime', 'bigint', '20', 1, 0, 0, '注册时间', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_updatedAt', 'box_user', 'updatetime', 'bigint', '20', 1, 0, 0, '更新时间', 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. 商品信息表 (box_goods)
INSERT INTO database_tables (
  id, projectId, name, displayName, comment, engine, charset, status, category, createdAt, updatedAt
) VALUES (
  'box_goods',
  'box-mall-system',
  'box_goods',
  '商品信息表',
  '商城商品目录表，支持实物和虚拟商品，包含价格体系、库存管理、分销配置等。支持RMB和幸运币双币种定价，预售功能，分销返佣设置',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  'product-catalog',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 商品表字段定义
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_goods_id', 'box_goods', 'id', 'int', '11', 0, 1, 1, '商品ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_category_id', 'box_goods', 'goodcategory_id', 'int', '11', 1, 0, 0, '商品分类ID', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_name', 'box_goods', 'goods_name', 'varchar', '255', 0, 0, 0, '商品名称', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_price', 'box_goods', 'price', 'decimal', '10,2', 0, 0, 0, '人民币价格', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_c_price', 'box_goods', 'c_price', 'int', '11', 1, 0, 0, '幸运币价格', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_stock', 'box_goods', 'stock', 'int', '11', 1, 0, 0, '库存数量', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_images', 'box_goods', 'good_images', 'text', '', 1, 0, 0, '商品图片(JSON数组)', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_type', 'box_goods', 'type', 'tinyint', '1', 1, 0, 0, '商品类型:0=实物,1=虚拟', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_switch', 'box_goods', 'goods_switch', 'tinyint', '1', 1, 0, 0, '商品状态:0=下架,1=上架', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_agent', 'box_goods', 'agent', 'tinyint', '1', 1, 0, 0, '参与分销:1=是,2=否', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. 盲盒配置表 (box_boxfl)
INSERT INTO database_tables (
  id, projectId, name, displayName, comment, engine, charset, status, category, createdAt, updatedAt
) VALUES (
  'box_boxfl',
  'box-mall-system',
  'box_boxfl',
  '盲盒配置表',
  '盲盒核心配置表，包含概率设置、价格策略、限购规则、特殊玩法等游戏机制。支持无限赏和一番赏两种模式，四级概率控制，连抽优惠，会员特权等',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  'gaming-rewards',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 盲盒配置表字段定义
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_boxfl_id', 'box_boxfl', 'id', 'int', '11', 0, 1, 1, '盲盒ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_game_type', 'box_boxfl', 'game_type', 'enum', '', 1, 0, 0, '游戏类型:unend=无限赏,limit=一番赏', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_name', 'box_boxfl', 'box_name', 'varchar', '255', 0, 0, 0, '盲盒名称', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_price', 'box_boxfl', 'price', 'decimal', '8,2', 1, 0, 0, '单抽价格', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_gj', 'box_boxfl', 'probability_gj', 'decimal', '5,2', 0, 0, 0, '高级商品概率%', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_xy', 'box_boxfl', 'probability_xy', 'decimal', '5,2', 0, 0, 0, '稀有商品概率%', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_ss', 'box_boxfl', 'probability_ss', 'decimal', '5,2', 0, 0, 0, '史诗商品概率%', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_cs', 'box_boxfl', 'probability_cs', 'decimal', '5,2', 0, 0, 0, '传说商品概率%', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_switch', 'box_boxfl', 'boxswitch', 'tinyint', '1', 0, 0, 0, '盲盒开关:0=关闭,1=开启', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_sort', 'box_boxfl', 'sort', 'int', '11', 1, 0, 0, '排序权重', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. 盲盒订单表 (box_order)
INSERT INTO database_tables (
  id, projectId, name, displayName, comment, engine, charset, status, category, createdAt, updatedAt
) VALUES (
  'box_order',
  'box-mall-system',
  'box_order',
  '盲盒订单表',
  '盲盒购买订单核心表，支持多种支付方式、优惠券、代付、送礼等功能。完整的订单生命周期管理，包含支付、开盒、分销、礼品功能',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  'order-transaction',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 订单表字段定义
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_order_id', 'box_order', 'id', 'int', '11', 0, 1, 1, '订单ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_boxfl_id', 'box_order', 'boxfl_id', 'int', '11', 1, 0, 0, '盲盒ID', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_user_id', 'box_order', 'user_id', 'int', '11', 1, 0, 0, '购买用户ID', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_pay_method', 'box_order', 'pay_method', 'enum', '', 1, 0, 0, '支付方式:wechat=微信,alipay=支付宝,yue=余额,xyb=幸运币', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_total_fee', 'box_order', 'total_fee', 'decimal', '10,2', 1, 0, 0, '订单原价', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_pay_coin', 'box_order', 'pay_coin', 'decimal', '10,2', 1, 0, 0, '实际支付金额', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_out_trade_no', 'box_order', 'out_trade_no', 'varchar', '100', 0, 0, 0, '商户订单号', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_status', 'box_order', 'status', 'enum', '', 1, 0, 0, '订单状态:unpay=待支付,used=已开盒,undei=已关闭,unopen=待开盒', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_num', 'box_order', 'num', 'int', '11', 1, 0, 0, '购买数量', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_pay_time', 'box_order', 'pay_time', 'int', '11', 1, 0, 0, '支付时间', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_create_time', 'box_order', 'create_time', 'int', '11', 1, 0, 0, '创建时间', 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. 中奖记录表 (box_prize_record)
INSERT INTO database_tables (
  id, projectId, name, displayName, comment, engine, charset, status, category, createdAt, updatedAt
) VALUES (
  'box_prize_record',
  'box-mall-system',
  'box_prize_record',
  '中奖记录表',
  '用户开盒中奖记录表，包含奖品信息、状态流转、物流处理等完整生命周期。支持多种奖品来源，完整的奖品状态管理，社交赠送功能',
  'InnoDB',
  'utf8mb4',
  'ACTIVE',
  'gaming-rewards',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 中奖记录表字段定义
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_prize_id', 'box_prize_record', 'id', 'int', '11', 0, 1, 1, '记录ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_boxfl_id', 'box_prize_record', 'boxfl_id', 'int', '11', 0, 0, 0, '盲盒ID', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_order_id', 'box_prize_record', 'order_id', 'varchar', '255', 0, 0, 0, '关联订单ID', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_user_id', 'box_prize_record', 'user_id', 'int', '11', 0, 0, 0, '中奖用户ID', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_goods_id', 'box_prize_record', 'goods_id', 'int', '11', 0, 0, 0, '奖品商品ID', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_goods_name', 'box_prize_record', 'goods_name', 'varchar', '255', 1, 0, 0, '奖品名称', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_goods_image', 'box_prize_record', 'goods_image', 'varchar', '255', 1, 0, 0, '奖品图片', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_status', 'box_prize_record', 'status', 'enum', '', 1, 0, 0, '奖品状态:bag=盒柜,exchange=已回收,delivery=申请发货,received=已收货', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_tag', 'box_prize_record', 'tag', 'enum', '', 1, 0, 0, '奖品稀有度:normal=高级,rare=稀有,supreme=史诗,legend=传说', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_create_time', 'box_prize_record', 'create_time', 'int', '11', 1, 0, 0, '中奖时间', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入思维导图布局数据
INSERT INTO mindmap_layouts (
  id, projectId, layoutType, nodes, edges, config, createdAt, updatedAt
) VALUES (
  'box-mall-mindmap',
  'box-mall-system',
  'hierarchical',
  '{"nodes": [{"id": "project-root", "type": "project", "position": {"x": 400, "y": 50}, "data": {"id": "box-mall-system", "name": "Box次元盲盒商城", "description": "综合性盲盒电商平台", "nodeType": "project"}}]}',
  '{"edges": []}',
  '{"layout": {"type": "hierarchical", "direction": "TB"}, "display": {"showLabels": true, "compactMode": false}, "filters": {"nodeTypes": ["project", "category", "table"], "edgeTypes": ["hierarchy", "foreignKey"]}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 脚本执行完成提示
SELECT 'Box次元盲盒商城系统数据导入完成，包含5张核心业务表和完整字段结构' as result;