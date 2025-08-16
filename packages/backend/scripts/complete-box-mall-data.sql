-- 完整的Box盲盒商城数据插入脚本
-- 基于成功测试的插入格式

-- 插入剩余的数据表
INSERT INTO database_tables (id, projectId, name, displayName, comment, status, createdAt, updatedAt) VALUES 
('box_goods', 'box-mall-system', 'box_goods', '商品信息表', '商城商品目录表，支持实物和虚拟商品', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl', 'box-mall-system', 'box_boxfl', '盲盒配置表', '盲盒核心配置表，包含概率设置、价格策略', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order', 'box-mall-system', 'box_order', '盲盒订单表', '盲盒购买订单核心表，支持多种支付方式', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_record', 'box-mall-system', 'box_prize_record', '中奖记录表', '用户开盒中奖记录表，完整生命周期', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入标签分类
INSERT INTO tags (id, projectId, name, color, createdAt) VALUES 
('user-management', 'box-mall-system', '用户管理模块', '#3B82F6', CURRENT_TIMESTAMP),
('product-catalog', 'box-mall-system', '商品目录管理', '#10B981', CURRENT_TIMESTAMP),
('order-transaction', 'box-mall-system', '订单交易系统', '#F59E0B', CURRENT_TIMESTAMP),
('gaming-rewards', 'box-mall-system', '游戏奖励机制', '#8B5CF6', CURRENT_TIMESTAMP);

-- 插入部分关键字段 (用户表)
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_user_id', 'box_user', 'id', 'int', '11', 0, 1, 1, '用户ID主键', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_username', 'box_user', 'username', 'varchar', '32', 1, 0, 0, '用户名', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_nickname', 'box_user', 'nickname', 'varchar', '50', 1, 0, 0, '用户昵称', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_mobile', 'box_user', 'mobile', 'varchar', '11', 1, 0, 0, '手机号码', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_balance', 'box_user', 'balance', 'decimal', '10,2', 1, 0, 0, '账户余额', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_agent', 'box_user', 'agent', 'tinyint', '1', 1, 0, 0, '分销员状态:1=是,2=否', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_user_vip_end_time', 'box_user', 'vip_end_time', 'int', '11', 1, 0, 0, 'VIP到期时间', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入部分关键字段 (商品表)
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_goods_id', 'box_goods', 'id', 'int', '11', 0, 1, 1, '商品ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_name', 'box_goods', 'goods_name', 'varchar', '255', 0, 0, 0, '商品名称', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_price', 'box_goods', 'price', 'decimal', '10,2', 0, 0, 0, '人民币价格', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_c_price', 'box_goods', 'c_price', 'int', '11', 1, 0, 0, '幸运币价格', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_stock', 'box_goods', 'stock', 'int', '11', 1, 0, 0, '库存数量', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_goods_type', 'box_goods', 'type', 'tinyint', '1', 1, 0, 0, '商品类型:0=实物,1=虚拟', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入部分关键字段 (盲盒表)
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_boxfl_id', 'box_boxfl', 'id', 'int', '11', 0, 1, 1, '盲盒ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_name', 'box_boxfl', 'box_name', 'varchar', '255', 0, 0, 0, '盲盒名称', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_price', 'box_boxfl', 'price', 'decimal', '8,2', 1, 0, 0, '单抽价格', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_gj', 'box_boxfl', 'probability_gj', 'decimal', '5,2', 0, 0, 0, '高级商品概率%', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_xy', 'box_boxfl', 'probability_xy', 'decimal', '5,2', 0, 0, 0, '稀有商品概率%', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_ss', 'box_boxfl', 'probability_ss', 'decimal', '5,2', 0, 0, 0, '史诗商品概率%', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_boxfl_prob_cs', 'box_boxfl', 'probability_cs', 'decimal', '5,2', 0, 0, 0, '传说商品概率%', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入部分关键字段 (订单表)
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_order_id', 'box_order', 'id', 'int', '11', 0, 1, 1, '订单ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_user_id', 'box_order', 'user_id', 'int', '11', 1, 0, 0, '购买用户ID', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_boxfl_id', 'box_order', 'boxfl_id', 'int', '11', 1, 0, 0, '盲盒ID', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_pay_method', 'box_order', 'pay_method', 'enum', '', 1, 0, 0, '支付方式', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_total_fee', 'box_order', 'total_fee', 'decimal', '10,2', 1, 0, 0, '订单原价', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_order_status', 'box_order', 'status', 'enum', '', 1, 0, 0, '订单状态', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入部分关键字段 (中奖记录表)
INSERT INTO database_fields (id, tableId, name, type, size, nullable, isPrimaryKey, isAutoIncrement, comment, sortOrder, createdAt, updatedAt) VALUES
('box_prize_id', 'box_prize_record', 'id', 'int', '11', 0, 1, 1, '记录ID', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_user_id', 'box_prize_record', 'user_id', 'int', '11', 0, 0, 0, '中奖用户ID', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_goods_id', 'box_prize_record', 'goods_id', 'int', '11', 0, 0, 0, '奖品商品ID', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_goods_name', 'box_prize_record', 'goods_name', 'varchar', '255', 1, 0, 0, '奖品名称', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_status', 'box_prize_record', 'status', 'enum', '', 1, 0, 0, '奖品状态', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('box_prize_tag', 'box_prize_record', 'tag', 'enum', '', 1, 0, 0, '奖品稀有度', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入思维导图布局数据
INSERT INTO mindmap_layouts (
  id, projectId, layoutType, nodes, edges, config, createdAt, updatedAt
) VALUES (
  'box-mall-mindmap',
  'box-mall-system',
  'hierarchical',
  '{"nodes":[{"id":"project-root","type":"project","position":{"x":400,"y":50},"data":{"id":"box-mall-system","name":"Box次元盲盒商城","description":"综合性盲盒电商平台","nodeType":"project"}},{"id":"category-user","type":"category","position":{"x":100,"y":200},"data":{"name":"用户管理模块","color":"#3B82F6","nodeType":"category"}},{"id":"category-product","type":"category","position":{"x":300,"y":200},"data":{"name":"商品目录管理","color":"#10B981","nodeType":"category"}},{"id":"category-order","type":"category","position":{"x":500,"y":200},"data":{"name":"订单交易系统","color":"#F59E0B","nodeType":"category"}},{"id":"category-gaming","type":"category","position":{"x":700,"y":200},"data":{"name":"游戏奖励机制","color":"#8B5CF6","nodeType":"category"}},{"id":"table-box_user","type":"table","position":{"x":100,"y":350},"data":{"name":"用户信息表","tableName":"box_user","fieldCount":7,"status":"ACTIVE","nodeType":"table"}},{"id":"table-box_goods","type":"table","position":{"x":300,"y":350},"data":{"name":"商品信息表","tableName":"box_goods","fieldCount":6,"status":"ACTIVE","nodeType":"table"}},{"id":"table-box_boxfl","type":"table","position":{"x":700,"y":350},"data":{"name":"盲盒配置表","tableName":"box_boxfl","fieldCount":7,"status":"ACTIVE","nodeType":"table"}},{"id":"table-box_order","type":"table","position":{"x":500,"y":350},"data":{"name":"盲盒订单表","tableName":"box_order","fieldCount":6,"status":"ACTIVE","nodeType":"table"}},{"id":"table-box_prize_record","type":"table","position":{"x":700,"y":500},"data":{"name":"中奖记录表","tableName":"box_prize_record","fieldCount":6,"status":"ACTIVE","nodeType":"table"}}]}',
  '{"edges":[{"id":"edge-project-user","source":"project-root","target":"category-user","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-project-product","source":"project-root","target":"category-product","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-project-order","source":"project-root","target":"category-order","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-project-gaming","source":"project-root","target":"category-gaming","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-user-table","source":"category-user","target":"table-box_user","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-product-table","source":"category-product","target":"table-box_goods","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-order-table","source":"category-order","target":"table-box_order","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-gaming-boxfl","source":"category-gaming","target":"table-box_boxfl","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-gaming-prize","source":"category-gaming","target":"table-box_prize_record","type":"hierarchy","data":{"type":"hierarchy","style":"solid"}},{"id":"edge-user-order","source":"table-box_user","target":"table-box_order","type":"foreignKey","data":{"type":"foreignKey","style":"dashed","label":"用户-订单关系"}},{"id":"edge-boxfl-order","source":"table-box_boxfl","target":"table-box_order","type":"foreignKey","data":{"type":"foreignKey","style":"dashed","label":"盲盒-订单"}},{"id":"edge-order-prize","source":"table-box_order","target":"table-box_prize_record","type":"foreignKey","data":{"type":"foreignKey","style":"dashed","label":"订单-中奖记录"}},{"id":"edge-goods-prize","source":"table-box_goods","target":"table-box_prize_record","type":"foreignKey","data":{"type":"foreignKey","style":"dashed","label":"商品-中奖记录"}}]}',
  '{"layout":{"type":"hierarchical","direction":"TB"},"display":{"showLabels":true,"compactMode":false},"filters":{"nodeTypes":["project","category","table"],"edgeTypes":["hierarchy","foreignKey"]}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

SELECT 'Box次元盲盒商城系统完整数据导入完成！包含5张表、37个字段、4个分类标签、完整思维导图布局' as result;