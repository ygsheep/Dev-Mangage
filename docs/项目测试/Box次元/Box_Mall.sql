/*
 Navicat Premium Dump SQL

 Source Server         : BOX次元
 Source Server Type    : MySQL
 Source Server Version : 80030 (8.0.30)
 Source Host           : dbconn.sealosbja.site:43238
 Source Schema         : mall

 Target Server Type    : MySQL
 Target Server Version : 80030 (8.0.30)
 File Encoding         : 65001

 Date: 16/08/2025 04:34:04
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for box_activity
-- ----------------------------
DROP TABLE IF EXISTS `box_activity`;
CREATE TABLE `box_activity`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `activityname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '活动名称',
  `activityimage` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '欧皇福利图片',
  `tcimage` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '弹窗图片',
  `boxfl_id` int NULL DEFAULT NULL COMMENT '关联盲盒',
  `tcswitch` tinyint(1) NULL DEFAULT NULL COMMENT '是否开启弹窗1开启0关闭',
  `award_type` tinyint(1) NULL DEFAULT NULL COMMENT '关联类型:1=盲盒,2=文章',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 10 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '欧皇福利管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_admin
-- ----------------------------
DROP TABLE IF EXISTS `box_admin`;
CREATE TABLE `box_admin`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '用户名',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '昵称',
  `password` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '密码',
  `salt` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '密码盐',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '头像',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '电子邮箱',
  `mobile` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '手机号码',
  `loginfailure` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '失败次数',
  `logintime` bigint NULL DEFAULT NULL COMMENT '登录时间',
  `loginip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '登录IP',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `token` varchar(59) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'Session标识',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '状态',
  `promoter_uid` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '代理账号id',
  `promoter_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '代理编号',
  `fanyong` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '返佣比例',
  `business_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '招商经理',
  `bank` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行及支行',
  `bank_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行卡号',
  `bank_user` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '持卡人',
  `is_agent` tinyint(1) NULL DEFAULT 0 COMMENT '是否代理',
  `no_agent_money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `yes_agent_money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `now_agent_money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `agent_money_note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `qrcode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '管理员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_admin_log
-- ----------------------------
DROP TABLE IF EXISTS `box_admin_log`;
CREATE TABLE `box_admin_log`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `admin_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '管理员ID',
  `username` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '管理员名字',
  `url` varchar(1500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '操作页面',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '日志标题',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'IP',
  `useragent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'User-Agent',
  `createtime` bigint NULL DEFAULT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `name`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16588 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '管理员日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_advert
-- ----------------------------
DROP TABLE IF EXISTS `box_advert`;
CREATE TABLE `box_advert`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `weigh` int NULL DEFAULT 0 COMMENT '权重',
  `status` enum('1','0') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '1' COMMENT '状态:0=隐藏,1=正常',
  `create_time` int NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '广告表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_agent_card
-- ----------------------------
DROP TABLE IF EXISTS `box_agent_card`;
CREATE TABLE `box_agent_card`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT 0 COMMENT '分销用户',
  `uname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '收款人',
  `card` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '银行卡号',
  `bank` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '开户行',
  `add_time` datetime NOT NULL COMMENT '添加时间',
  `wx` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '微信',
  `zfb` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支付宝',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '银行卡管理' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_agent_fanyong
-- ----------------------------
DROP TABLE IF EXISTS `box_agent_fanyong`;
CREATE TABLE `box_agent_fanyong`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单编号',
  `agent_id` int NOT NULL COMMENT '代理',
  `agent_uid` int NOT NULL COMMENT '代理用户',
  `user_id` int NOT NULL COMMENT '用户ID',
  `box_total_fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '开盒实付金额',
  `fanyong` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '返佣比例',
  `fanyong_fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '代理返佣金额',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  `goods_rmb_price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '商品总价值',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '代理返佣明细' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_agent_lev
-- ----------------------------
DROP TABLE IF EXISTS `box_agent_lev`;
CREATE TABLE `box_agent_lev`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '等级名称',
  `lev` int NOT NULL COMMENT '等级权重',
  `lev1` decimal(5, 2) NOT NULL COMMENT '上级上浮比例',
  `lev2` decimal(5, 2) NOT NULL COMMENT '上上级上浮比例',
  `task` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '升级条件',
  `task_type` tinyint(1) NULL DEFAULT 1 COMMENT '条件类型:1=全部满足,2=任意一个',
  `note` varchar(600) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '描述',
  `bg_image` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '背景图',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '分销等级' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_agent_money_log
-- ----------------------------
DROP TABLE IF EXISTS `box_agent_money_log`;
CREATE TABLE `box_agent_money_log`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '类型:分销分佣,分销提现',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态:1=待处理,2=已处理,3=拒绝',
  `user_id` int NULL DEFAULT 0 COMMENT '客户id',
  `jz_order_sn` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联订单号',
  `price` decimal(10, 2) NOT NULL COMMENT '金额',
  `note` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '备注',
  `skr` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人',
  `bank` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '开户行',
  `bankcard` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '银行卡',
  `sh_ren` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人',
  `addtime` datetime NOT NULL COMMENT '提交时间',
  `donetime` datetime NULL DEFAULT NULL COMMENT '处理时间',
  `zfb` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `wx` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '资金明细' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_app_version
-- ----------------------------
DROP TABLE IF EXISTS `box_app_version`;
CREATE TABLE `box_app_version`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `platform` enum('h5','android','ios','applets') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '平台类别:h5=H5,android=安卓,ios=苹果,applets=小程序',
  `version` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '版本号',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '更新内容',
  `download_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '下载地址',
  `enforce` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '强制更新',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '版本表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_area
-- ----------------------------
DROP TABLE IF EXISTS `box_area`;
CREATE TABLE `box_area`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `pid` int NULL DEFAULT NULL COMMENT '父id',
  `shortname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '简称',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '名称',
  `mergename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '全称',
  `level` tinyint NULL DEFAULT NULL COMMENT '层级:1=省,2=市,3=区/县',
  `pinyin` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '拼音',
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '长途区号',
  `zip` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮编',
  `first` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '首字母',
  `lng` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '经度',
  `lat` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '纬度',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `pid`(`pid` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '地区表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_attachment
-- ----------------------------
DROP TABLE IF EXISTS `box_attachment`;
CREATE TABLE `box_attachment`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '类别',
  `admin_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '管理员ID',
  `user_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '会员ID',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '物理路径',
  `imagewidth` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '宽度',
  `imageheight` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '高度',
  `imagetype` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '图片类型',
  `imageframes` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '图片帧数',
  `filename` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '文件名称',
  `filesize` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件大小',
  `mimetype` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'mime类型',
  `extparam` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '透传数据',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建日期',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `uploadtime` bigint NULL DEFAULT NULL COMMENT '上传时间',
  `storage` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'local' COMMENT '存储位置',
  `sha1` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '文件 sha1编码',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 541 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '附件表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_auth_group
-- ----------------------------
DROP TABLE IF EXISTS `box_auth_group`;
CREATE TABLE `box_auth_group`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `pid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '父组别',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '组名',
  `rules` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分组表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_auth_group_access
-- ----------------------------
DROP TABLE IF EXISTS `box_auth_group_access`;
CREATE TABLE `box_auth_group_access`  (
  `uid` int UNSIGNED NOT NULL COMMENT '会员ID',
  `group_id` int UNSIGNED NOT NULL COMMENT '级别ID',
  UNIQUE INDEX `uid_group_id`(`uid` ASC, `group_id` ASC) USING BTREE,
  INDEX `uid`(`uid` ASC) USING BTREE,
  INDEX `group_id`(`group_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '权限分组表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_auth_rule
-- ----------------------------
DROP TABLE IF EXISTS `box_auth_rule`;
CREATE TABLE `box_auth_rule`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` enum('menu','file') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'file' COMMENT 'menu为菜单,file为权限节点',
  `pid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '父ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '规则名称',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '规则名称',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '图标',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '规则URL',
  `condition` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '条件',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '备注',
  `ismenu` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否为菜单',
  `menutype` enum('addtabs','blank','dialog','ajax') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '菜单类型',
  `extend` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '扩展属性',
  `py` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '拼音首字母',
  `pinyin` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '拼音',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `weigh` int NOT NULL DEFAULT 0 COMMENT '权重',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  INDEX `pid`(`pid` ASC) USING BTREE,
  INDEX `weigh`(`weigh` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 560 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '节点表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_banner
-- ----------------------------
DROP TABLE IF EXISTS `box_banner`;
CREATE TABLE `box_banner`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag` enum('scsy','home','homejg','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '位置:scsy=商城,home=首页,home_jg=首页金刚区',
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '名称',
  `image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '' COMMENT '图片',
  `weigh` int NULL DEFAULT NULL COMMENT '排序',
  `bswitch` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态:0=隐藏,1=显示',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL,
  `boxfl_id` int NULL DEFAULT NULL,
  `path` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 17 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '商城轮播图管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_box
-- ----------------------------
DROP TABLE IF EXISTS `box_box`;
CREATE TABLE `box_box`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `category_id` int UNSIGNED NOT NULL COMMENT '分类ID',
  `box_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '盲盒名称',
  `box_banner_images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '盲盒详情banner',
  `box_banner_images_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '盲盒详情banner文字',
  `box_foot_images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `box_foot_images_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `coin_price` int NULL DEFAULT NULL COMMENT '金币价格',
  `is_hot` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '热门标识:1热门,0非热门',
  `is_cheap` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '低价标识:1低价,0非低价',
  `is_try` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '试一试标识',
  `sales` int UNSIGNED NULL DEFAULT 0 COMMENT '销量',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  `sort` int UNSIGNED NULL DEFAULT 0 COMMENT '自定义排序',
  `switch` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '显示隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1006 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '盲盒表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_box_detail
-- ----------------------------
DROP TABLE IF EXISTS `box_box_detail`;
CREATE TABLE `box_box_detail`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `box_id` int UNSIGNED NOT NULL COMMENT '盲盒ID',
  `goods_id` int UNSIGNED NOT NULL COMMENT '商品ID',
  `rate` decimal(10, 2) NULL DEFAULT NULL COMMENT '概率',
  `weigh` int UNSIGNED NULL DEFAULT 100 COMMENT '权重',
  `create_time` int NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '盲盒详情' ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_boxcate
-- ----------------------------
DROP TABLE IF EXISTS `box_boxcate`;
CREATE TABLE `box_boxcate`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `cate_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '名称',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `status` enum('hidden','normal') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'normal' COMMENT '状态:normal=正常,hidden=隐藏',
  `updatetime` int NOT NULL DEFAULT 0 COMMENT '编辑时间',
  `weigh` int NULL DEFAULT 0 COMMENT '排序',
  `pid` int NULL DEFAULT 0,
  `face_image` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 62 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '盲盒分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_boxfl
-- ----------------------------
DROP TABLE IF EXISTS `box_boxfl`;
CREATE TABLE `box_boxfl`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '盲盒ID',
  `game_type` enum('unend','limit') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT 'unend' COMMENT '盲盒类型:unend=无限赏,limit=一番赏',
  `box_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '盲盒名称',
  `box_cate_id` int UNSIGNED NULL DEFAULT 0 COMMENT '分类ID',
  `box_banner_images` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '盲盒首页banner',
  `box_foot_images` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '盲盒首页底部图片',
  `box_label` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '盲盒标签',
  `box_label2` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '盲盒标签2',
  `price` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '盲盒价格',
  `probability_gj` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '高级商品概率',
  `probability_xy` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '稀有商品概率',
  `probability_ss` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '史诗商品概率',
  `probability_cs` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '传说商品概率',
  `boxswitch` tinyint(1) NOT NULL COMMENT '盲盒开关',
  `first_order_discount` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否参加新人首单优惠活动 1是 0否',
  `sort` int NOT NULL DEFAULT 99 COMMENT '盲盒排序',
  `5times_draw` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '' COMMENT '5抽必中商品id',
  `10times_draw` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '' COMMENT '10抽必中商品id',
  `lcyhbl` int NULL DEFAULT 0 COMMENT '连抽优惠比例',
  `lcyhjg` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '新人首单价格',
  `five_vip_days` int NULL DEFAULT 0 COMMENT '5抽赠送会员天数',
  `ten_vip_days` int NULL DEFAULT 0 COMMENT '10抽赠送会员天数',
  `buy_limit` int NULL DEFAULT 0 COMMENT '限购',
  `buy_limit_price` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '解锁限购需消费',
  `first_price` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '盲盒首单价格',
  `is_free` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '是否免单 1是 0否',
  `box_num` int NULL DEFAULT 1 COMMENT '开启箱数',
  `end_box_num` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '已结束箱编号',
  `lock_status` tinyint(1) NULL DEFAULT 0 COMMENT '是否支持锁盒',
  `is_del` tinyint(1) NULL DEFAULT 0 COMMENT '是否删除',
  `show_index` tinyint(1) NULL DEFAULT 0 COMMENT '是否首页展示',
  `anget` tinyint(1) NULL DEFAULT 2 COMMENT '参与分销:1=是,2=否',
  `anget_lev1` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '上级分佣',
  `anget_lev2` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '上上级分佣',
  `fragment_mode` tinyint(1) NULL DEFAULT 0 COMMENT '碎片模式:0=关闭,1=开启',
  `fragment_cost` decimal(10, 2) NULL DEFAULT 9.90 COMMENT '碎片模式费用',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 127 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '盲盒管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_boxfl_lock
-- ----------------------------
DROP TABLE IF EXISTS `box_boxfl_lock`;
CREATE TABLE `box_boxfl_lock`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `box_id` int NULL DEFAULT NULL COMMENT '盲盒ID',
  `user_id` int NULL DEFAULT NULL,
  `box_num_no` int NULL DEFAULT 1 COMMENT '箱数编号',
  `second` int NULL DEFAULT NULL COMMENT '锁定秒数',
  `memo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '锁盒记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_boxfl_no
-- ----------------------------
DROP TABLE IF EXISTS `box_boxfl_no`;
CREATE TABLE `box_boxfl_no`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `box_id` int NULL DEFAULT NULL COMMENT '盲盒ID',
  `box_num_no` int NULL DEFAULT 1 COMMENT '箱数编号',
  `status` enum('normal','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'hidden' COMMENT '状态:normal=上架,hidden=下架',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  `stock` int NULL DEFAULT 0 COMMENT '总库存',
  `total_stock` int NULL DEFAULT 0 COMMENT '原始总库存',
  `game_type` enum('flip','limit','unend') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '玩法类型:limit=有限赏,unend=无限赏',
  `prize_info_json` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `is_lock` tinyint(1) NULL DEFAULT 0 COMMENT '是否锁盒:0=否,1=是',
  `lock_expire_time` int NULL DEFAULT 0 COMMENT '锁盒到期时间',
  `lock_uid` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 335 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '盲盒箱数' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_card
-- ----------------------------
DROP TABLE IF EXISTS `box_card`;
CREATE TABLE `box_card`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '重抽卡名称',
  `switch` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '重抽卡管理表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_card_list
-- ----------------------------
DROP TABLE IF EXISTS `box_card_list`;
CREATE TABLE `box_card_list`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `card_id` int NULL DEFAULT NULL COMMENT '重抽卡ID',
  `lqsm` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '领取说明',
  `status` tinyint(1) NULL DEFAULT NULL COMMENT '状态:0=未使用,1=已使用',
  `lqtime` int NULL DEFAULT NULL COMMENT '领取时间',
  `sytime` int NULL DEFAULT NULL COMMENT '使用时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 288 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '重抽卡使用记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_carpass
-- ----------------------------
DROP TABLE IF EXISTS `box_carpass`;
CREATE TABLE `box_carpass`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `password` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '卡密',
  `price` decimal(10, 2) NOT NULL COMMENT '金额',
  `user` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '购买者',
  `utime` timestamp NOT NULL COMMENT '上传时间',
  `etime` timestamp NULL DEFAULT NULL COMMENT '核销时间',
  `status` enum('0','1') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '状态:0=待核销,1=已核销',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_category
-- ----------------------------
DROP TABLE IF EXISTS `box_category`;
CREATE TABLE `box_category`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `pid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '父ID',
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '栏目类型',
  `name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `flag` set('hot','index','recommend') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `image` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '图片',
  `keywords` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '关键字',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '描述',
  `diyname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '自定义名称',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `weigh` int NOT NULL DEFAULT 0 COMMENT '权重',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `weigh`(`weigh` ASC, `id` ASC) USING BTREE,
  INDEX `pid`(`pid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_ces
-- ----------------------------
DROP TABLE IF EXISTS `box_ces`;
CREATE TABLE `box_ces`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `price` decimal(10, 2) NULL DEFAULT NULL COMMENT '价格',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = 'ces ' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_chest_box
-- ----------------------------
DROP TABLE IF EXISTS `box_chest_box`;
CREATE TABLE `box_chest_box`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `box_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '宝箱名称',
  `status` enum('1','0') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '1' COMMENT '状态 1:正常,0:下架',
  `create_time` int NULL DEFAULT 0 COMMENT '创建时间',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '签到宝箱' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_chest_box_detail
-- ----------------------------
DROP TABLE IF EXISTS `box_chest_box_detail`;
CREATE TABLE `box_chest_box_detail`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `box_id` int NOT NULL COMMENT '宝箱ID',
  `box_type` enum('1','2','3','4','5') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '类型 1:优惠券,2:道具卡,3:烛星石,4:幸运币,5:盲盒',
  `goods_id` int UNSIGNED NULL DEFAULT 0 COMMENT '优惠券ID/道具卡ID (烛星石没有)',
  `goods_value` int UNSIGNED NULL DEFAULT 1 COMMENT '数量',
  `goods_rate` int UNSIGNED NULL DEFAULT 0 COMMENT '概率',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sign_box`(`box_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '签到宝箱详情' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_coin_record
-- ----------------------------
DROP TABLE IF EXISTS `box_coin_record`;
CREATE TABLE `box_coin_record`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `before` decimal(10, 2) UNSIGNED NULL DEFAULT NULL COMMENT '变更前',
  `after` decimal(10, 2) UNSIGNED NULL DEFAULT NULL COMMENT '变更后',
  `coin` decimal(10, 2) NULL DEFAULT NULL COMMENT '变更数量',
  `type` enum('pay_shop','recharge','duihan','fxfy','buy_box','sign') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变更类型:pay_shop=购买商品,recharge=盲盒回收,duihuan=兑换码兑换,fxfy=好友开盒,sign=签到',
  `order_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '盲盒订单ID',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  `memo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `out_trade_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '幸运币记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_command
-- ----------------------------
DROP TABLE IF EXISTS `box_command`;
CREATE TABLE `box_command`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `type` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '类型',
  `params` varchar(1500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '参数',
  `command` varchar(1500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '命令',
  `content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL COMMENT '返回结果',
  `executetime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '执行时间',
  `createtime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `status` enum('successed','failured') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'failured' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 89 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '在线命令表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_community_circle
-- ----------------------------
DROP TABLE IF EXISTS `box_community_circle`;
CREATE TABLE `box_community_circle`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '圈子名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '圈子描述',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '圈子头像',
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '圈子封面',
  `creator_id` int UNSIGNED NOT NULL COMMENT '创建者ID',
  `member_count` int UNSIGNED NULL DEFAULT 0 COMMENT '成员数量',
  `post_count` int UNSIGNED NULL DEFAULT 0 COMMENT '帖子数量',
  `max_members` int UNSIGNED NULL DEFAULT 10000 COMMENT '最大成员数',
  `is_private` tinyint(1) NULL DEFAULT 0 COMMENT '是否私密圈子:0=公开,1=私密',
  `join_approval` tinyint(1) NULL DEFAULT 0 COMMENT '是否需要审核加入:0=不需要,1=需要',
  `is_recommended` tinyint(1) NULL DEFAULT 0 COMMENT '是否推荐:0=否,1=是',
  `is_hot` tinyint(1) NULL DEFAULT 0 COMMENT '是否热门:0=否,1=是',
  `hot_score` int NULL DEFAULT 0 COMMENT '热门分数(根据活跃度计算)',
  `view_count` int UNSIGNED NULL DEFAULT 0 COMMENT '浏览量',
  `today_post_count` int UNSIGNED NULL DEFAULT 0 COMMENT '今日帖子数',
  `today_active_members` int UNSIGNED NULL DEFAULT 0 COMMENT '今日活跃成员数',
  `last_post_time` bigint NULL DEFAULT NULL COMMENT '最后发帖时间',
  `recommend_reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '推荐理由',
  `recommend_time` bigint NULL DEFAULT NULL COMMENT '推荐时间',
  `recommend_admin_id` int UNSIGNED NULL DEFAULT NULL COMMENT '推荐管理员ID',
  `status` enum('active','inactive','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态:active=活跃,inactive=不活跃,closed=关闭',
  `sort` int NULL DEFAULT 0 COMMENT '排序权重',
  `tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标签，逗号分隔',
  `notice` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '圈子公告',
  `rules` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '圈子规则',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_creator_id`(`creator_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_sort`(`sort` ASC) USING BTREE,
  INDEX `idx_member_count`(`member_count` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE,
  INDEX `idx_is_recommended`(`is_recommended` ASC) USING BTREE,
  INDEX `idx_is_hot`(`is_hot` ASC) USING BTREE,
  INDEX `idx_hot_score`(`hot_score` ASC) USING BTREE,
  INDEX `idx_view_count`(`view_count` ASC) USING BTREE,
  INDEX `idx_last_post_time`(`last_post_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '社区圈子表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_collect
-- ----------------------------
DROP TABLE IF EXISTS `box_community_collect`;
CREATE TABLE `box_community_collect`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `post_id` int UNSIGNED NOT NULL COMMENT '帖子ID',
  `folder_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'default' COMMENT '收藏夹名称',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_post`(`user_id` ASC, `post_id` ASC) USING BTREE,
  INDEX `idx_post_id`(`post_id` ASC) USING BTREE,
  INDEX `idx_folder_name`(`folder_name` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_comment
-- ----------------------------
DROP TABLE IF EXISTS `box_community_comment`;
CREATE TABLE `box_community_comment`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `post_id` int UNSIGNED NOT NULL COMMENT '帖子ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '评论者ID',
  `parent_id` int UNSIGNED NULL DEFAULT 0 COMMENT '父评论ID',
  `reply_to_uid` int UNSIGNED NULL DEFAULT 0 COMMENT '回复的用户ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '图片列表(JSON格式)',
  `like_count` int UNSIGNED NULL DEFAULT 0 COMMENT '点赞数',
  `reply_count` int UNSIGNED NULL DEFAULT 0 COMMENT '回复数',
  `level` tinyint NULL DEFAULT 1 COMMENT '评论层级:1=一级评论,2=二级评论,3=三级评论',
  `status` enum('normal','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '状态:normal=正常,deleted=已删除',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'IP地址',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_post_id`(`post_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `idx_reply_to_uid`(`reply_to_uid` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 38 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '评论表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_follow
-- ----------------------------
DROP TABLE IF EXISTS `box_community_follow`;
CREATE TABLE `box_community_follow`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `follower_id` int UNSIGNED NOT NULL COMMENT '关注者ID',
  `following_id` int UNSIGNED NOT NULL COMMENT '被关注者ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_follow_relation`(`follower_id` ASC, `following_id` ASC) USING BTREE,
  INDEX `idx_following_id`(`following_id` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '关注表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_like
-- ----------------------------
DROP TABLE IF EXISTS `box_community_like`;
CREATE TABLE `box_community_like`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `target_type` enum('post','comment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '目标类型:post=帖子,comment=评论',
  `target_id` int UNSIGNED NOT NULL COMMENT '目标ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_target`(`user_id` ASC, `target_type` ASC, `target_id` ASC) USING BTREE,
  INDEX `idx_target`(`target_type` ASC, `target_id` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '点赞表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_member
-- ----------------------------
DROP TABLE IF EXISTS `box_community_member`;
CREATE TABLE `box_community_member`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `circle_id` int UNSIGNED NOT NULL COMMENT '圈子ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `role` enum('owner','admin','member') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'member' COMMENT '角色:owner=圈主,admin=管理员,member=普通成员',
  `status` enum('active','pending','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态:active=正常,pending=待审核,banned=被禁',
  `post_count` int UNSIGNED NULL DEFAULT 0 COMMENT '在此圈子的帖子数',
  `join_reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '加入理由',
  `jointime` bigint NULL DEFAULT NULL COMMENT '加入时间',
  `last_active_time` bigint NULL DEFAULT NULL COMMENT '最后活跃时间',
  `banned_reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '禁用原因',
  `banned_time` bigint NULL DEFAULT NULL COMMENT '禁用时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_circle_user`(`circle_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_jointime`(`jointime` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '圈子成员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_post
-- ----------------------------
DROP TABLE IF EXISTS `box_community_post`;
CREATE TABLE `box_community_post`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `circle_id` int UNSIGNED NOT NULL COMMENT '圈子ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '发布者ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '帖子标题',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '帖子内容',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '图片列表(JSON格式)',
  `video` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '视频地址',
  `type` enum('text','image','video','text_image','text_video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容类型',
  `tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标签，逗号分隔',
  `like_count` int UNSIGNED NULL DEFAULT 0 COMMENT '点赞数',
  `comment_count` int UNSIGNED NULL DEFAULT 0 COMMENT '评论数',
  `view_count` int UNSIGNED NULL DEFAULT 0 COMMENT '浏览数',
  `share_count` int UNSIGNED NULL DEFAULT 0 COMMENT '分享数',
  `collect_count` int UNSIGNED NULL DEFAULT 0 COMMENT '收藏数',
  `is_top` tinyint(1) NULL DEFAULT 0 COMMENT '是否置顶:0=否,1=是',
  `is_hot` tinyint(1) NULL DEFAULT 0 COMMENT '是否热门:0=否,1=是',
  `is_featured` tinyint(1) NULL DEFAULT 0 COMMENT '是否推荐:0=否,1=是',
  `audit_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '审核状态:pending=待审核,approved=已通过,rejected=已拒绝',
  `audit_time` bigint NULL DEFAULT NULL COMMENT '审核时间',
  `audit_admin_id` int UNSIGNED NULL DEFAULT NULL COMMENT '审核管理员ID',
  `audit_remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '审核备注',
  `status` enum('normal','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '状态:normal=正常,deleted=已删除',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'IP地址',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '发布地点',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_circle_id`(`circle_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_audit_status`(`audit_status` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE,
  INDEX `idx_is_hot`(`is_hot` ASC) USING BTREE,
  INDEX `idx_is_featured`(`is_featured` ASC) USING BTREE,
  INDEX `idx_is_top`(`is_top` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_like_count`(`like_count` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '社区帖子表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_report
-- ----------------------------
DROP TABLE IF EXISTS `box_community_report`;
CREATE TABLE `box_community_report`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '举报者ID',
  `target_type` enum('post','comment','user','circle') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报目标类型:post=帖子,comment=评论,user=用户,circle=圈子',
  `target_id` int UNSIGNED NOT NULL COMMENT '目标ID',
  `reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报原因',
  `reason_type` enum('spam','abuse','inappropriate','copyright','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报类型:spam=垃圾信息,abuse=辱骂,inappropriate=不当内容,copyright=侵权,other=其他',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '详细描述',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '举报图片(JSON格式)',
  `status` enum('pending','processing','processed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '处理状态:pending=待处理,processing=处理中,processed=已处理,rejected=已拒绝',
  `admin_id` int UNSIGNED NULL DEFAULT NULL COMMENT '处理管理员ID',
  `admin_remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '处理备注',
  `process_result` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '处理结果',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'IP地址',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_target`(`target_type` ASC, `target_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_reason_type`(`reason_type` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '举报表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_sensitive_word
-- ----------------------------
DROP TABLE IF EXISTS `box_community_sensitive_word`;
CREATE TABLE `box_community_sensitive_word`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `word` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '敏感词',
  `type` enum('block','replace','warning') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'block' COMMENT '处理方式:block=阻止,replace=替换,warning=警告',
  `replacement` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '***' COMMENT '替换词',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'general' COMMENT '分类:general=通用,politics=政治,violence=暴力,etc',
  `level` tinyint NULL DEFAULT 1 COMMENT '敏感等级:1=低,2=中,3=高',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用:0=禁用,1=启用',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建者ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_word`(`word` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '敏感词表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_tag
-- ----------------------------
DROP TABLE IF EXISTS `box_community_tag`;
CREATE TABLE `box_community_tag`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名称',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标签描述',
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#1890ff' COMMENT '标签颜色',
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标签图标',
  `use_count` int UNSIGNED NULL DEFAULT 0 COMMENT '使用次数',
  `is_hot` tinyint(1) NULL DEFAULT 0 COMMENT '是否热门标签:0=否,1=是',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态:active=启用,inactive=禁用',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建者ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name` ASC) USING BTREE,
  INDEX `idx_use_count`(`use_count` ASC) USING BTREE,
  INDEX `idx_is_hot`(`is_hot` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_community_user_stat
-- ----------------------------
DROP TABLE IF EXISTS `box_community_user_stat`;
CREATE TABLE `box_community_user_stat`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `post_count` int UNSIGNED NULL DEFAULT 0 COMMENT '发帖数',
  `comment_count` int UNSIGNED NULL DEFAULT 0 COMMENT '评论数',
  `like_count` int UNSIGNED NULL DEFAULT 0 COMMENT '点赞数',
  `collect_count` int UNSIGNED NULL DEFAULT 0 COMMENT '收藏数',
  `follow_count` int UNSIGNED NULL DEFAULT 0 COMMENT '关注数',
  `follower_count` int UNSIGNED NULL DEFAULT 0 COMMENT '粉丝数',
  `circle_count` int UNSIGNED NULL DEFAULT 0 COMMENT '加入圈子数',
  `total_view_count` int UNSIGNED NULL DEFAULT 0 COMMENT '帖子总浏览数',
  `total_like_received` int UNSIGNED NULL DEFAULT 0 COMMENT '获得点赞总数',
  `level` tinyint NULL DEFAULT 1 COMMENT '社区等级',
  `experience` int UNSIGNED NULL DEFAULT 0 COMMENT '经验值',
  `reputation` int UNSIGNED NULL DEFAULT 0 COMMENT '声望值',
  `last_active_time` bigint NULL DEFAULT NULL COMMENT '最后活跃时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_reputation`(`reputation` ASC) USING BTREE,
  INDEX `idx_last_active_time`(`last_active_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户社区统计表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_config
-- ----------------------------
DROP TABLE IF EXISTS `box_config`;
CREATE TABLE `box_config`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '变量名',
  `group` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '分组',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '变量标题',
  `tip` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '变量描述',
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '类型:string,text,int,bool,array,datetime,date,file',
  `visible` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '可见条件',
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '变量值',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '变量字典数据',
  `rule` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '验证规则',
  `extend` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '扩展属性',
  `setting` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '配置',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统配置' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_coupon
-- ----------------------------
DROP TABLE IF EXISTS `box_coupon`;
CREATE TABLE `box_coupon`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `couponname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '优惠券名称',
  `typetag` enum('0','1') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '0' COMMENT '状态:0=无门槛,1=满减',
  `amount` int NULL DEFAULT NULL COMMENT '面值金额',
  `mzamount` int NULL DEFAULT NULL COMMENT '满足金额',
  `add_time` int NULL DEFAULT NULL COMMENT '添加时间',
  `end_time` int NULL DEFAULT NULL COMMENT '过期时间',
  `content` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  `days` int NULL DEFAULT 0 COMMENT '有限天数',
  `stock` int NOT NULL DEFAULT 0 COMMENT '库存',
  `limit_num` int NOT NULL DEFAULT 0 COMMENT '每人限领',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 19 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '优惠券管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_coupon_list
-- ----------------------------
DROP TABLE IF EXISTS `box_coupon_list`;
CREATE TABLE `box_coupon_list`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `coupon_id` int NULL DEFAULT NULL COMMENT '优惠券ID',
  `status` int NULL DEFAULT NULL COMMENT '状态0未使用1已使用',
  `sytime` int NULL DEFAULT NULL COMMENT '使用时间',
  `order_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '' COMMENT '使用优惠券订单号',
  `couname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '优惠券名称',
  `end_time` int NOT NULL,
  `source` enum('qiandao','kami','renwu','sys','yaoqing') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT 'sys' COMMENT '来源:qiandao=签到,kami=兑换,renwu=任务,sys=系统',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 76 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '优惠券使用记录表' ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_delivery_order
-- ----------------------------
DROP TABLE IF EXISTS `box_delivery_order`;
CREATE TABLE `box_delivery_order`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_id` int UNSIGNED NULL DEFAULT NULL COMMENT '盲盒购买订单ID',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '购买盲盒商户订单号',
  `delivery_order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '发货订单号',
  `delivery_trade_id` int UNSIGNED NULL DEFAULT NULL COMMENT '发货交易订单ID',
  `prize_id` int UNSIGNED NULL DEFAULT NULL COMMENT '中奖记录ID',
  `goods_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '奖品名称',
  `goods_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '奖品图片',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '收货人姓名',
  `mobile` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '收货人电话',
  `province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '省份',
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市',
  `area` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地区',
  `detail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '详细地址',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '完整收货地址',
  `post_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递公司名称',
  `post_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递公司代码',
  `delivery_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递单号',
  `status` enum('undelivered','unreceived','finished','unpay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpay' COMMENT '发货状态:unpay=待支付,undelivered=待发货,unreceived=待收货,finished=已完成',
  `backend_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '后台已读标识:1已读,0未读',
  `delivery_time` int UNSIGNED NULL DEFAULT NULL COMMENT '发货时间',
  `receive_time` int UNSIGNED NULL DEFAULT NULL COMMENT '收货时间',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '发货订单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_delivery_trade
-- ----------------------------
DROP TABLE IF EXISTS `box_delivery_trade`;
CREATE TABLE `box_delivery_trade`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `pay_method` enum('wechat','alipay','coin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式:wechat=微信,alipay=支付宝,coin=金币',
  `rmb_amount` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT 'RMB总金额',
  `coin_amount` int UNSIGNED NULL DEFAULT 0 COMMENT '金币总金额',
  `status` enum('unpay','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpay' COMMENT '订单状态:unpay=待支付,paid=已支付',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商户订单号',
  `transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信平台订单号',
  `alipay_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付宝订单号',
  `pay_time` int UNSIGNED NULL DEFAULT NULL COMMENT '支付时间',
  `pay_rmb` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '支付RMB',
  `pay_coin` int UNSIGNED NULL DEFAULT 0 COMMENT '支付金币',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '申请发货交易订单' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_detailed
-- ----------------------------
DROP TABLE IF EXISTS `box_detailed`;
CREATE TABLE `box_detailed`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `lytag` enum('yaoqing','kaihe') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '来源:yaoqing=邀请好友,kaihe=好友开盒',
  `lxtag` enum('yhq','box') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '奖励:yhq=优惠券,box=盲盒',
  `boxfl_id` int NULL DEFAULT NULL COMMENT '奖励盲盒ID',
  `coupon_id` int NULL DEFAULT NULL COMMENT '奖励优惠券ID',
  `laiyuan` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '奖励来源',
  `jltime` int NULL DEFAULT NULL COMMENT '奖励时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_ems
-- ----------------------------
DROP TABLE IF EXISTS `box_ems`;
CREATE TABLE `box_ems`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `event` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '事件',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '邮箱',
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '验证码',
  `times` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '验证次数',
  `ip` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'IP',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '邮箱验证码表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_faq
-- ----------------------------
DROP TABLE IF EXISTS `box_faq`;
CREATE TABLE `box_faq`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '标题',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '内容',
  `createtime` int NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` int NULL DEFAULT NULL COMMENT '更新时间',
  `deletetime` int NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '常见问题' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_feedback
-- ----------------------------
DROP TABLE IF EXISTS `box_feedback`;
CREATE TABLE `box_feedback`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '反馈用户',
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '反馈类型',
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '反馈内容',
  `images` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片',
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系电话',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '是否处理:0=未处理,1=已处理',
  `remark` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '处理备注',
  `createtime` int NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` int NULL DEFAULT NULL COMMENT '更新时间',
  `deletetime` int NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '意见反馈' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_finance_day
-- ----------------------------
DROP TABLE IF EXISTS `box_finance_day`;
CREATE TABLE `box_finance_day`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` date NULL DEFAULT NULL COMMENT '日期',
  `wechat_fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '微信充值',
  `sand_fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '杉德支付',
  `box_fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '开盒金额',
  `shop_fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '商城销售',
  `xs` decimal(20, 2) NULL DEFAULT NULL COMMENT '星石总余额',
  `xyb` decimal(20, 2) NULL DEFAULT NULL COMMENT '幸运币总余额',
  `alipay_fee` decimal(10, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '财务日报' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_fragment_draw_logs
-- ----------------------------
DROP TABLE IF EXISTS `box_fragment_draw_logs`;
CREATE TABLE `box_fragment_draw_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `order_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '关联订单号',
  `box_id` int NOT NULL COMMENT '关联盲盒ID(box_boxfl表)',
  `drawn_fragments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '抽取的9个碎片(JSON)',
  `synthesized_result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '合成结果(JSON)',
  `total_synthesized` int NULL DEFAULT 0 COMMENT '本次合成生肖总数',
  `cost_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '消耗金额',
  `draw_time` bigint NULL DEFAULT NULL COMMENT '抽取时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `box_id`(`box_id` ASC) USING BTREE,
  INDEX `draw_time`(`draw_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 49 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '碎片抽取合成记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_fragment_exchange_logs
-- ----------------------------
DROP TABLE IF EXISTS `box_fragment_exchange_logs`;
CREATE TABLE `box_fragment_exchange_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `product_id` int NOT NULL COMMENT '兑换的商品ID',
  `fragments_used` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '使用的碎片信息(JSON)',
  `order_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联订单号',
  `mall_order_id` int NULL DEFAULT NULL COMMENT '关联商城订单ID(box_mall_order表)',
  `status` enum('pending','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '兑换状态',
  `exchange_time` bigint NULL DEFAULT NULL COMMENT '兑换时间',
  `delivery_status` enum('pending','shipped','delivered') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '发货状态',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `product_id`(`product_id` ASC) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `mall_order_id`(`mall_order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '碎片兑换记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_fragment_types
-- ----------------------------
DROP TABLE IF EXISTS `box_fragment_types`;
CREATE TABLE `box_fragment_types`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '碎片ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '碎片名称',
  `zodiac` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '生肖名称',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '碎片图标',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '碎片描述',
  `probability` decimal(5, 2) NULL DEFAULT 8.33 COMMENT '抽取概率(%)',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '状态',
  `sort` int NULL DEFAULT 0 COMMENT '排序',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `zodiac`(`zodiac` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '碎片类型表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_fx_details
-- ----------------------------
DROP TABLE IF EXISTS `box_fx_details`;
CREATE TABLE `box_fx_details`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` int NULL DEFAULT NULL COMMENT '盲盒ID',
  `out_trade_no` int UNSIGNED NULL DEFAULT NULL COMMENT '商品ID',
  `money` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '标签:supreme=史诗,legend=传说',
  `level` int NULL DEFAULT NULL COMMENT '昵称',
  `fx_money` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `bz` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `create_time` int NULL DEFAULT NULL,
  `fx_user_id` int NULL DEFAULT NULL,
  `fx_rote` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_goodcategory
-- ----------------------------
DROP TABLE IF EXISTS `box_goodcategory`;
CREATE TABLE `box_goodcategory`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pid` int NULL DEFAULT NULL COMMENT '父级',
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT 'goods' COMMENT '类型',
  `flname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '分类名称',
  `image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '分类图片',
  `creattime` int NULL DEFAULT NULL COMMENT '创建时间',
  `categoryswitch` tinyint(1) NULL DEFAULT 1 COMMENT '状态',
  `weigh` int NULL DEFAULT NULL COMMENT '权重',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 68 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '商品分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_goods
-- ----------------------------
DROP TABLE IF EXISTS `box_goods`;
CREATE TABLE `box_goods`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `goodcategory_id` int NULL DEFAULT NULL COMMENT '归属分类',
  `goods_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '商品名称',
  `pirce` decimal(10, 2) NOT NULL COMMENT '商品RMB价格',
  `c_pirce` int NULL DEFAULT 0 COMMENT '商品幸运币价格',
  `stock` int NULL DEFAULT NULL COMMENT '库存',
  `good_images` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '商品图片',
  `gooddetails` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '商品详情',
  `freight` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '运费',
  `type` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '类型:0=实物商品,1=虚拟商品',
  `goods_switch` tinyint(1) NOT NULL DEFAULT 1 COMMENT '商品开关 0:关 1:开',
  `sort` tinyint NOT NULL DEFAULT 99 COMMENT '商品排序',
  `box_goods_swith` tinyint(1) NULL DEFAULT 0 COMMENT '盲盒商品库:0=隐藏,1=显示',
  `is_presale` tinyint(1) NULL DEFAULT 0 COMMENT '是否预售:0=否,1=是',
  `delivery_date` date NULL DEFAULT NULL COMMENT '预计到货时间',
  `goodscode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '商品编号',
  `luckycoin` int NULL DEFAULT 0 COMMENT '兑换幸运币',
  `anget` tinyint(1) NULL DEFAULT 2 COMMENT '参与分销:1=是,2=否',
  `anget_lev1` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '上级分佣',
  `anget_lev2` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '上上级分佣',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2009 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '商城商品表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_invite_record
-- ----------------------------
DROP TABLE IF EXISTS `box_invite_record`;
CREATE TABLE `box_invite_record`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `inviter_id` int UNSIGNED NULL DEFAULT NULL COMMENT '邀请人ID',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '邀请记录表' ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_kami
-- ----------------------------
DROP TABLE IF EXISTS `box_kami`;
CREATE TABLE `box_kami`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `kahao` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '' COMMENT '兑换码',
  `amount` int NULL DEFAULT 0 COMMENT '发放总数',
  `relation_type` enum('prop','coupon','xs','goods','box') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '兑换类型:prop=道具卡,coupon=优惠券,xs=星石,goods=普通商品,box=盲盒',
  `relation_id` int NULL DEFAULT 0 COMMENT '关联id',
  `status` enum('normal','hidden') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT 'normal' COMMENT '状态:normal=正常,hidden=隐藏',
  `fnum` int NULL DEFAULT 1 COMMENT '单次发放',
  `yunum` int NULL DEFAULT 0 COMMENT '结余',
  `createtime` int NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 16 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '兑换码管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_kamilist
-- ----------------------------
DROP TABLE IF EXISTS `box_kamilist`;
CREATE TABLE `box_kamilist`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '使用用户ID',
  `kami_id` int NULL DEFAULT NULL COMMENT '卡密ID',
  `sytime` int NULL DEFAULT NULL COMMENT '使用时间',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 45 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '卡密使用记录表' ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_mall_order
-- ----------------------------
DROP TABLE IF EXISTS `box_mall_order`;
CREATE TABLE `box_mall_order`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `goods_id` int UNSIGNED NULL DEFAULT NULL COMMENT '商品ID',
  `goods_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商品名称',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商品图片',
  `coin_price` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '金币售价',
  `rmb_price` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '人民币售价',
  `num` int UNSIGNED NULL DEFAULT 0 COMMENT '数量',
  `coin_amount` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '金币总价',
  `rmb_amount` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '人民币总价',
  `delivery_fee` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '运费',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `pay_method` enum('coin','wechat','alipay','money') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式:coin=金币,wechat=微信,alipay=支付宝,money=余额',
  `pay_coin` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '支付金币',
  `pay_rmb` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '支付人民币',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商户订单号',
  `transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信平台订单号',
  `alipay_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付宝订单号',
  `pay_time` int UNSIGNED NULL DEFAULT NULL COMMENT '付款时间',
  `user_name` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收货人名称',
  `user_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收货人电话',
  `user_address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收货人地址',
  `post_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递公司名称',
  `post_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递公司代码',
  `delivery_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递单号',
  `delivery_time` int UNSIGNED NULL DEFAULT NULL COMMENT '发货时间',
  `receive_time` int UNSIGNED NULL DEFAULT NULL COMMENT '收货时间',
  `status` enum('unpay','undelivered','unreceived','finished') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpay' COMMENT '状态:unpay=待支付,undelivered=待发货,unreceived=待收货,finished=已完成',
  `backend_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '后台已读标识:1已读,0未读',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '商城订单表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_member_right
-- ----------------------------
DROP TABLE IF EXISTS `box_member_right`;
CREATE TABLE `box_member_right`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `right_type` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '权益类别',
  `title` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT ' 权益名称',
  `show_title` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '显示权益名称',
  `image` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '权益图标',
  `explain` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '权益介绍',
  `number` int NOT NULL DEFAULT 1 COMMENT '规则数字',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序倒序',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0:禁用，1：启用',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '添加时间',
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`, `right_type`) USING BTREE,
  INDEX `type`(`right_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '会员权益' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_member_ship
-- ----------------------------
DROP TABLE IF EXISTS `box_member_ship`;
CREATE TABLE `box_member_ship`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `type` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'month' COMMENT '会员类别month:月卡会员；quarter:季卡；year:年卡；ever:永久；free:免费',
  `title` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '会员名称',
  `vip_day` int NOT NULL DEFAULT 0 COMMENT '会员时间(天)',
  `price` decimal(8, 2) NOT NULL DEFAULT 0.00 COMMENT '原价',
  `pre_price` decimal(8, 2) NOT NULL DEFAULT 0.00 COMMENT '优惠后价格',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序倒序',
  `is_del` int NOT NULL DEFAULT 0 COMMENT '删除',
  `createtime` int NOT NULL DEFAULT 0 COMMENT '添加时间',
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `type`(`type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '会员类型' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_mhgoods
-- ----------------------------
DROP TABLE IF EXISTS `box_mhgoods`;
CREATE TABLE `box_mhgoods`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `goods_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '商品名称',
  `boxfl_id` int NOT NULL COMMENT '归属盲盒',
  `goods_images` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '商品图片',
  `goods_stock` int NULL DEFAULT NULL COMMENT '商品库存',
  `goods_pirce` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '商品价值',
  `delivery_fee` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '运费',
  `create_time` int NULL DEFAULT NULL COMMENT '添加时间',
  `tag` enum('normal','rare','supreme','legend','S','A','B','C','D','E','F','G','H','I') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '标签:normal=高级,rare=稀有 ,supreme=史诗,legend=传说,S,A,B,C,D,E,F,G,H,I',
  `luckycoin` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '价值幸运币',
  `ms` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '商品描述',
  `probability` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '100.00' COMMENT '商品概率',
  `goods_id` int NOT NULL COMMENT '商品ID',
  `total_stock` int NOT NULL COMMENT '原始库存',
  `stock` int NOT NULL COMMENT '余量库存',
  `box_num_no` int NOT NULL DEFAULT 0 COMMENT '箱数编号',
  `weigh` int NULL DEFAULT 0 COMMENT '排序',
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  `open_sort` int NULL DEFAULT 1 COMMENT '出赏顺序',
  `event_num` int NULL DEFAULT NULL COMMENT '每x发出1发',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 4761 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '盲盒商品管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_mhlog
-- ----------------------------
DROP TABLE IF EXISTS `box_mhlog`;
CREATE TABLE `box_mhlog`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `mhgoodsname` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '抽中奖品名称',
  `mhimage` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '抽中奖品图片',
  `addtime` int NULL DEFAULT NULL COMMENT '开盒时间',
  `mhgoods_id` int NULL DEFAULT NULL COMMENT '抽中奖品ID',
  `username` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '用户昵称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7261 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_mhorder
-- ----------------------------
DROP TABLE IF EXISTS `box_mhorder`;
CREATE TABLE `box_mhorder`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `ooid` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '订单号',
  `pirce` decimal(10, 2) NULL DEFAULT NULL COMMENT '支付金额',
  `goodname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '商品名称',
  `dkprice` decimal(10, 2) NULL DEFAULT NULL COMMENT '抵扣金额',
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '支付类型',
  `status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '订单状态',
  `creattime` int NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_money_record
-- ----------------------------
DROP TABLE IF EXISTS `box_money_record`;
CREATE TABLE `box_money_record`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `before` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '变更前',
  `after` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '变更后',
  `money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '变更金额',
  `type` enum('box_exchange','refund','withdrawal','to_coin','withdrawal_fail','withdrawals','yezhifu') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变更类型:box_exchange=盲盒回收,refund=库存不足，支付返回,withdrawal=佣金提现,to_coin=转到钱包,withdrawal_fail=提现失败,withdrawals=余额提现,yezhifu=余额支付',
  `order_id` int UNSIGNED NULL DEFAULT NULL COMMENT '盲盒订单ID',
  `prize_id` int UNSIGNED NULL DEFAULT NULL COMMENT '奖品ID',
  `withdrawal_id` int UNSIGNED NULL DEFAULT 0,
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '余额记录表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_moneylog
-- ----------------------------
DROP TABLE IF EXISTS `box_moneylog`;
CREATE TABLE `box_moneylog`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `beforemoney` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '变更前星石余额',
  `aftermoney` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '变更后星石余额',
  `money` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '变更额度',
  `bgexplain` enum('sing_jl','dikou','kami','admin','recharge') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '变更原因:sign_jl=签到下发奖励,dikou=抵扣使用',
  `addtime` int NULL DEFAULT NULL COMMENT '变更时间',
  `memo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  `out_trade_no` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1222 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_notice
-- ----------------------------
DROP TABLE IF EXISTS `box_notice`;
CREATE TABLE `box_notice`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '名称',
  `desc` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT '内容',
  `jianjie` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '简介',
  `pop_type` enum('shouye','cangku','sys') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'sys' COMMENT '位置:shouye=首页,cangku=仓库,sys=系统',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '系统通知表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_notification_log
-- ----------------------------
DROP TABLE IF EXISTS `box_notification_log`;
CREATE TABLE `box_notification_log`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `notification_id` int UNSIGNED NOT NULL COMMENT '通知ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `send_type` enum('realtime','push','email','sms') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发送方式',
  `send_status` enum('pending','success','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '发送状态',
  `send_result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '发送结果详情',
  `send_time` bigint NULL DEFAULT NULL COMMENT '发送时间',
  `retry_count` tinyint NULL DEFAULT 0 COMMENT '重试次数',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_notification_id`(`notification_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_send_status`(`send_status` ASC) USING BTREE,
  INDEX `idx_send_time`(`send_time` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知发送记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_notification_queue
-- ----------------------------
DROP TABLE IF EXISTS `box_notification_queue`;
CREATE TABLE `box_notification_queue`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `sub_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知子类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '通知内容',
  `extra_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '额外数据(JSON格式)',
  `priority` tinyint NULL DEFAULT 5 COMMENT '优先级:1-10,数字越小优先级越高',
  `status` enum('pending','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '处理状态',
  `scheduled_time` bigint NULL DEFAULT NULL COMMENT '计划发送时间',
  `processed_time` bigint NULL DEFAULT NULL COMMENT '处理时间',
  `retry_count` tinyint NULL DEFAULT 0 COMMENT '重试次数',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '错误信息',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_scheduled_time`(`scheduled_time` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知队列表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_notification_setting
-- ----------------------------
DROP TABLE IF EXISTS `box_notification_setting`;
CREATE TABLE `box_notification_setting`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `order_notify` tinyint(1) NULL DEFAULT 1 COMMENT '订单通知开关:0=关闭,1=开启',
  `community_notify` tinyint(1) NULL DEFAULT 1 COMMENT '社区通知开关:0=关闭,1=开启',
  `system_notify` tinyint(1) NULL DEFAULT 1 COMMENT '系统通知开关:0=关闭,1=开启',
  `message_notify` tinyint(1) NULL DEFAULT 1 COMMENT '私信通知开关:0=关闭,1=开启',
  `push_notify` tinyint(1) NULL DEFAULT 1 COMMENT '推送通知开关:0=关闭,1=开启',
  `email_notify` tinyint(1) NULL DEFAULT 0 COMMENT '邮件通知开关:0=关闭,1=开启',
  `sms_notify` tinyint(1) NULL DEFAULT 0 COMMENT '短信通知开关:0=关闭,1=开启',
  `quiet_start_time` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '22:00' COMMENT '免打扰开始时间',
  `quiet_end_time` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '08:00' COMMENT '免打扰结束时间',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知设置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_notification_template
-- ----------------------------
DROP TABLE IF EXISTS `box_notification_template`;
CREATE TABLE `box_notification_template`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `sub_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知子类型',
  `title_template` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题模板',
  `content_template` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容模板',
  `variables` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '模板变量说明(JSON格式)',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用:0=禁用,1=启用',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建者ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_type_subtype`(`type` ASC, `sub_type` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知模板表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_order
-- ----------------------------
DROP TABLE IF EXISTS `box_order`;
CREATE TABLE `box_order`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `boxfl_id` int UNSIGNED NULL DEFAULT NULL COMMENT '盲盒ID',
  `boxfl_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '盲盒名称',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '盲盒主图',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `pay_method` enum('wechat','alipay','yue','xyb','sand') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式:wechat=微信,alipay=支付宝,yue=余额,xyb=幸运币',
  `total_fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原总价',
  `xingshi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '抵扣星石数量',
  `coupon_fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '优惠券[幸运币]抵扣价格',
  `pay_coin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '支付价格',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商户订单号',
  `transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信平台订单号',
  `alipay_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付宝订单号',
  `pay_time` int UNSIGNED NULL DEFAULT NULL COMMENT '付款时间',
  `status` enum('unpay','used','undei','unopen') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpay' COMMENT '状态:unpay=待支付,used=已开盒,undei=已关闭,unopen=待开盒',
  `backend_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '后台已读标识:1已读,0未读',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  `terminal` int NULL DEFAULT NULL COMMENT '终端：0=h5,1=小程序,2=APP',
  `num` int NULL DEFAULT NULL COMMENT '数量',
  `delivery_fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '运费',
  `ischou` int NOT NULL DEFAULT 0 COMMENT '是否已经抽过奖品',
  `start_chou` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否开始抽奖防止重复抽奖 0未开始1已开始',
  `couid` int NULL DEFAULT 0 COMMENT '使用优惠券抵扣id',
  `is_use_again` tinyint(1) NULL DEFAULT 0 COMMENT '是否使用重抽卡',
  `is_behalf_pay` tinyint(1) NULL DEFAULT 0 COMMENT '是否代付',
  `behalf_uid` int NULL DEFAULT NULL COMMENT '代付人员ID',
  `behalf_repeat_pid` int NULL DEFAULT NULL COMMENT '重复代付订单',
  `open_time` int NULL DEFAULT NULL COMMENT '开盒时间',
  `gift_status` tinyint(1) NULL DEFAULT 0 COMMENT '送礼状态:0=无,1=待领取,2=已领取',
  `gift_send_uid` int NULL DEFAULT NULL COMMENT '送给好友ID',
  `gift_receive_time` int NULL DEFAULT NULL COMMENT '礼物领取时间',
  `box_num_no` int NULL DEFAULT NULL COMMENT '箱数号',
  `agent_lev1_uid` int NULL DEFAULT 0 COMMENT '上级uid',
  `agent_lev1_percent` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '分佣百分比',
  `agent_lev1_price` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '上级分佣',
  `agent_lev1_price_note` varchar(300) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '上级分佣备注',
  `agent_lev1_price_js` tinyint(1) NULL DEFAULT 2 COMMENT '上级是否结算:1=是,2=否',
  `agent_lev2_uid` int NULL DEFAULT 0 COMMENT '上上级uid',
  `agent_lev2_percent` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '分佣百分比',
  `agent_lev2_price` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '上上级分佣',
  `agent_lev2_price_note` varchar(300) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '上上级分佣备注',
  `agent_lev2_price_js` tinyint(1) NULL DEFAULT 2 COMMENT '上上级是否结算:1=是,2=否',
  `fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `fragment_mode` tinyint(1) NULL DEFAULT 0 COMMENT '是否碎片模式订单',
  `fragment_results` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '碎片抽取合成结果(JSON)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_out_trade_no_index`(`out_trade_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3599 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '盲盒购买订单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_piaochuang
-- ----------------------------
DROP TABLE IF EXISTS `box_piaochuang`;
CREATE TABLE `box_piaochuang`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `boxfl_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '盲盒ID',
  `goods_id` int UNSIGNED NULL DEFAULT NULL COMMENT '商品ID',
  `tag` enum('supreme','legend') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '标签:supreme=史诗,legend=传说',
  `phone` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '昵称',
  `beizhu` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 605 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_post
-- ----------------------------
DROP TABLE IF EXISTS `box_post`;
CREATE TABLE `box_post`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `post_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递公司名称',
  `post_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递代码',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '快递公司信息' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_price_range
-- ----------------------------
DROP TABLE IF EXISTS `box_price_range`;
CREATE TABLE `box_price_range`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `range` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '区间',
  `weigh` int UNSIGNED NULL DEFAULT 100 COMMENT '权重',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '价格区间表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_prize_record
-- ----------------------------
DROP TABLE IF EXISTS `box_prize_record`;
CREATE TABLE `box_prize_record`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `boxfl_id` int UNSIGNED NOT NULL COMMENT '盲盒ID',
  `order_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '盲盒购买订单ID',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商户订单号',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `goods_id` int UNSIGNED NOT NULL COMMENT '奖品ID',
  `goods_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '奖品名称',
  `goods_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '奖品图片',
  `goods_coin_price` int UNSIGNED NULL DEFAULT 0 COMMENT '奖品幸运币价值',
  `goods_rmb_price` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '奖品RMB价值',
  `status` enum('bag','exchange','delivery','received','send','gift') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '奖品状态:bag=盒柜,exchange=已回收,delivery=申请发货,received=已收货,send=已赠送',
  `exchange_time` int UNSIGNED NULL DEFAULT NULL COMMENT '回收时间',
  `delivery_time` int UNSIGNED NULL DEFAULT NULL COMMENT '申请发货时间',
  `delivery_fee` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '运费',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '开箱时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  `hstime` int NOT NULL COMMENT '回收时间',
  `again_time` int NULL DEFAULT NULL COMMENT '重抽时间',
  `source` enum('qiandao','kami','renwu','sys','mh','send','gift') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'mh' COMMENT '来源:qiandao=签到,kami=兑换,renwu=任务,sys=系统,send=好友赠送,gift=礼物',
  `to_user_id` int NULL DEFAULT 0 COMMENT '赠送好友',
  `from_user_id` int NULL DEFAULT 0 COMMENT '来源好友',
  `send_time` int NULL DEFAULT 0 COMMENT '赠送时间',
  `memo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '备注',
  `cost_price` decimal(10, 2) NULL DEFAULT NULL,
  `tag` enum('normal','rare','supreme','legend','S','A','B','C','D','E','F','G','H','I') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '标签:normal=高级,rare=稀有 ,supreme=史诗,legend=传说,S,A,B,C,D,E,F,G,H,I',
  `is_presale` tinyint(1) NULL DEFAULT 0 COMMENT '是否预售:0=否,1=是',
  `delivery_date` date NULL DEFAULT NULL COMMENT '预计到货时间',
  `box_goods_id` int NULL DEFAULT NULL,
  `box_num_no` int NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11531 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '中奖记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_product_fragments
-- ----------------------------
DROP TABLE IF EXISTS `box_product_fragments`;
CREATE TABLE `box_product_fragments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL COMMENT '商品ID(关联box_goods表)',
  `fragment_id` int NOT NULL COMMENT '碎片ID',
  `required_quantity` int NOT NULL COMMENT '需要数量',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `product_fragment`(`product_id` ASC, `fragment_id` ASC) USING BTREE,
  INDEX `product_id`(`product_id` ASC) USING BTREE,
  INDEX `fragment_id`(`fragment_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商品碎片需求表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_prop
-- ----------------------------
DROP TABLE IF EXISTS `box_prop`;
CREATE TABLE `box_prop`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `prop_type` enum('chongchou','huishou','baoyou') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'chongchou' COMMENT '道具类型:chongchou=重抽卡,huishou=回收卡,baoyou=包邮卡',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '道具名称',
  `days` int UNSIGNED NULL DEFAULT 0 COMMENT '有限天数',
  `back_per` int NULL DEFAULT 0 COMMENT '回收卡回收比例',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '道具说明',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '道具管理' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_prop_user
-- ----------------------------
DROP TABLE IF EXISTS `box_prop_user`;
CREATE TABLE `box_prop_user`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户',
  `prop_id` int NOT NULL COMMENT '道具',
  `prop_type` enum('chongchou','huishou','baoyou') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '道具类型:chongchou=重抽卡,huishou=回收卡,baoyou=包邮卡',
  `back_per` int NULL DEFAULT 0 COMMENT '回收卡比例',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '状态:0=未使用,1=已使用',
  `end_time` int NULL DEFAULT 0 COMMENT '过期时间',
  `use_time` int NULL DEFAULT NULL COMMENT '使用时间',
  `order_type` enum('mh','goods') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '使用类型:mh=盲盒订单,goods=商城订单',
  `order_id` int NULL DEFAULT 0 COMMENT '订单号',
  `source` enum('qiandao','kami','renwu','sys') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'sys' COMMENT '来源:qiandao=签到,kami=兑换,renwu=任务,sys=系统',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户道具' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_rank_bot
-- ----------------------------
DROP TABLE IF EXISTS `box_rank_bot`;
CREATE TABLE `box_rank_bot`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '昵称',
  `fee` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '荣誉值',
  `avatar` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '头像',
  `create_time` int NULL DEFAULT NULL COMMENT '日期',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '排行榜' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_recharge_config
-- ----------------------------
DROP TABLE IF EXISTS `box_recharge_config`;
CREATE TABLE `box_recharge_config`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `price` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '支付金额',
  `recharge_money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '充值数',
  `weigh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '0' COMMENT '排序',
  `createtime` int NULL DEFAULT NULL,
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '充值配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_recharge_li
-- ----------------------------
DROP TABLE IF EXISTS `box_recharge_li`;
CREATE TABLE `box_recharge_li`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `rmb` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT 'RMB价格（充值之后会到余额里面）',
  `weigh` int UNSIGNED NULL DEFAULT 100 COMMENT '权重',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '充值选择列表' ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_recharge_order
-- ----------------------------
DROP TABLE IF EXISTS `box_recharge_order`;
CREATE TABLE `box_recharge_order`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `coin_amount` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0' COMMENT '金币数量',
  `rmb_amount` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '人民币总价',
  `pay_method` enum('wechat','alipay','sand') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式:wechat=微信,alipay=支付宝',
  `pay_rmb` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0.00' COMMENT '支付人民币',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商户订单号',
  `transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信平台订单号',
  `alipay_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付宝订单号',
  `pay_time` int UNSIGNED NULL DEFAULT NULL COMMENT '付款时间',
  `status` enum('unpay','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpay' COMMENT '状态:unpay=待支付,paid=已支付',
  `backend_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '后台已读标识:1已读,0未读',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '充值订单表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_retail_detail
-- ----------------------------
DROP TABLE IF EXISTS `box_retail_detail`;
CREATE TABLE `box_retail_detail`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '给谁分佣',
  `source_user_id` int UNSIGNED NOT NULL COMMENT '分佣来自于谁',
  `level` int UNSIGNED NOT NULL COMMENT '几级',
  `coin` decimal(12, 2) NULL DEFAULT 0.00 COMMENT '分佣金额',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `userphone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '受益者',
  `sourcephone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '充值人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分佣明细表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_retail_invitation
-- ----------------------------
DROP TABLE IF EXISTS `box_retail_invitation`;
CREATE TABLE `box_retail_invitation`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `pid` int UNSIGNED NULL DEFAULT NULL COMMENT '邀请人ID',
  `level` int UNSIGNED NULL DEFAULT NULL COMMENT '1/2/3级',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `pid`(`pid` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分销关系表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_search_history
-- ----------------------------
DROP TABLE IF EXISTS `box_search_history`;
CREATE TABLE `box_search_history`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `search` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '搜索内容',
  `create_time` int NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户搜索记录表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_setting
-- ----------------------------
DROP TABLE IF EXISTS `box_setting`;
CREATE TABLE `box_setting`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `appurl` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'App下载地址',
  `tutorialfile` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '新手教程',
  `syswitch` tinyint(1) NULL DEFAULT NULL COMMENT '首页弹窗开关',
  `share_jl` decimal(10, 2) NULL DEFAULT NULL COMMENT '奖励幸运币',
  `coupon_id` int NULL DEFAULT NULL COMMENT '奖励优惠券ID',
  `share_fy` decimal(10, 2) NULL DEFAULT NULL COMMENT '返佣比例',
  `card_id` int NULL DEFAULT NULL COMMENT '新人首次兑换获得重抽卡ID',
  `kfimage` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '客服二维码',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  `mpappid` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '小程序ID',
  `mpappkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '小程序密钥',
  `payid` int NULL DEFAULT NULL COMMENT '微信支付商户号',
  `paykey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '微信支付密钥',
  `lcyhbl` decimal(10, 2) NULL DEFAULT NULL COMMENT '连抽优惠比例',
  `lcyhjg` decimal(10, 2) NULL DEFAULT 0.01 COMMENT '连抽优惠价格',
  `kdkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '快递100key',
  `kdcustomer` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '快递100customer',
  `accessid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '阿里云id',
  `accesskey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '阿里云key',
  `endpoint` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'OSS实例地址',
  `bucket` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'OSS存储空间名称',
  `appId` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'APP支付宝支付ID',
  `rsaPrivateKey` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT 'APP支付应用私钥',
  `alipayrsaPublicKey` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT 'APP支付应用公钥',
  `wxappid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'APP微信登录ID',
  `wxappkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'App微信登录key',
  `yzfid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '易支付ID',
  `yzfkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '易支付密钥',
  `yzfurl` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '易支付地址',
  `boxfl_id` int NOT NULL,
  `domain` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `oss_domain` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '',
  `xyb_rate` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '幸运币支付比例',
  `pay_method` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '支付方式',
  `logo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  `user_avatar` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '用户默认头像',
  `auth_avatar` tinyint(1) NULL DEFAULT NULL COMMENT '是否强制获取头像昵称',
  `is_pay_vip` tinyint(1) NULL DEFAULT 0 COMMENT '付费会员开关',
  `vip_box` int NULL DEFAULT 0 COMMENT '开盒升级会员跳转盲盒',
  `box_music` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '' COMMENT '开盒音乐',
  `back_music` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '' COMMENT '背景音乐',
  `box_music_switch` tinyint(1) NULL DEFAULT 0 COMMENT '开盒 音乐开关',
  `back_music_switch` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '背景音乐开关',
  `oac_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '公众号二维码',
  `exchange_switch` tinyint(1) NULL DEFAULT 0 COMMENT '1 开启 0隐藏',
  `send_switch` tinyint(1) NULL DEFAULT 0 COMMENT '赠送开关',
  `shop_switch` tinyint(1) NULL DEFAULT NULL,
  `box_gift_switch` tinyint(1) NULL DEFAULT 0 COMMENT '盲盒赠送开关',
  `behalf_pay_switch` tinyint(1) NULL DEFAULT 0 COMMENT '盲盒代付开关',
  `box_goods_freight` int NULL DEFAULT 0 COMMENT '提货运费',
  `box_goods_freefreight_unit` int NULL DEFAULT 0 COMMENT '提货满包邮',
  `lock_max_seconds` int NULL DEFAULT 90 COMMENT '锁盒最大时长',
  `lock_num` int NULL DEFAULT 5 COMMENT '锁盒发数门槛',
  `lock_add_seconds` int NULL DEFAULT 15 COMMENT '锁盒每发增加时长',
  `lock_minutes` int NULL DEFAULT 5 COMMENT '锁盒条件限制门槛多少分钟内',
  `xcx_logo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '小程序logo',
  `site_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '程序名称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '设置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_setting_copy1
-- ----------------------------
DROP TABLE IF EXISTS `box_setting_copy1`;
CREATE TABLE `box_setting_copy1`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `appurl` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'App下载地址',
  `tutorialfile` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '新手教程',
  `syswitch` tinyint(1) NULL DEFAULT NULL COMMENT '首页弹窗开关',
  `share_jl` decimal(10, 2) NULL DEFAULT NULL COMMENT '奖励幸运币',
  `coupon_id` int NULL DEFAULT NULL COMMENT '奖励优惠券ID',
  `share_fy` decimal(10, 2) NULL DEFAULT NULL COMMENT '返佣比例',
  `card_id` int NULL DEFAULT NULL COMMENT '新人首次兑换获得重抽卡ID',
  `kfimage` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '客服二维码',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  `mpappid` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '小程序ID',
  `mpappkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '小程序密钥',
  `payid` int NULL DEFAULT NULL COMMENT '微信支付商户号',
  `paykey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '微信支付密钥',
  `lcyhbl` decimal(10, 2) NULL DEFAULT NULL COMMENT '连抽优惠比例',
  `lcyhjg` decimal(10, 2) NULL DEFAULT 0.01 COMMENT '连抽优惠价格',
  `kdkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '快递100key',
  `kdcustomer` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '快递100customer',
  `accessid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '阿里云id',
  `accesskey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '阿里云key',
  `endpoint` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'OSS实例地址',
  `bucket` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'OSS存储空间名称',
  `appId` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'APP支付宝支付ID',
  `rsaPrivateKey` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT 'APP支付应用私钥',
  `alipayrsaPublicKey` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL COMMENT 'APP支付应用公钥',
  `wxappid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'APP微信登录ID',
  `wxappkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT 'App微信登录key',
  `yzfid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '易支付ID',
  `yzfkey` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '易支付密钥',
  `yzfurl` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '易支付地址',
  `boxfl_id` int NOT NULL,
  `domain` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `oss_domain` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '',
  `xyb_rate` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '幸运币支付比例',
  `pay_method` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '支付方式',
  `logo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL,
  `user_avatar` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '用户默认头像',
  `auth_avatar` tinyint(1) NULL DEFAULT NULL COMMENT '是否强制获取头像昵称',
  `is_pay_vip` tinyint(1) NULL DEFAULT 0 COMMENT '付费会员开关',
  `vip_box` int NULL DEFAULT 0 COMMENT '开盒升级会员跳转盲盒',
  `box_music` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '' COMMENT '开盒音乐',
  `back_music` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT '' COMMENT '背景音乐',
  `box_music_switch` tinyint(1) NULL DEFAULT 0 COMMENT '开盒 音乐开关',
  `back_music_switch` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '背景音乐开关',
  `oac_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL COMMENT '公众号二维码',
  `exchange_switch` tinyint(1) NULL DEFAULT 0 COMMENT '1 开启 0隐藏',
  `send_switch` tinyint(1) NULL DEFAULT 0 COMMENT '赠送开关',
  `shop_switch` tinyint(1) NULL DEFAULT NULL,
  `box_gift_switch` tinyint(1) NULL DEFAULT 0 COMMENT '盲盒赠送开关',
  `behalf_pay_switch` tinyint(1) NULL DEFAULT 0 COMMENT '盲盒代付开关',
  `box_goods_freight` int NULL DEFAULT 0 COMMENT '提货运费',
  `box_goods_freefreight_unit` int NULL DEFAULT 0 COMMENT '提货满包邮',
  `lock_max_seconds` int NULL DEFAULT 90 COMMENT '锁盒最大时长',
  `lock_num` int NULL DEFAULT 5 COMMENT '锁盒发数门槛',
  `lock_add_seconds` int NULL DEFAULT 15 COMMENT '锁盒每发增加时长',
  `lock_minutes` int NULL DEFAULT 5 COMMENT '锁盒条件限制门槛多少分钟内',
  `xcx_logo` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '小程序logo',
  `site_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '程序名称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '设置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_shai
-- ----------------------------
DROP TABLE IF EXISTS `box_shai`;
CREATE TABLE `box_shai`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `box_mc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '盲盒名称',
  `box_tx` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '盲盒详情banner',
  `box_zw` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '盲盒详情banner文字',
  `box_img` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '盲盒详情banner',
  `switch` tinyint NOT NULL DEFAULT 0 COMMENT '是否审核通过0未审核1通过',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `delete_time` int NOT NULL,
  `category_id` int NOT NULL,
  `update_time` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '盲盒表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_shop_type
-- ----------------------------
DROP TABLE IF EXISTS `box_shop_type`;
CREATE TABLE `box_shop_type`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '类型名称',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_shoporder
-- ----------------------------
DROP TABLE IF EXISTS `box_shoporder`;
CREATE TABLE `box_shoporder`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_type` enum('sqfh','shop') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'shop' COMMENT '订单类型:sqfh=盲盒商品申请发货,shop=商城订单',
  `shop_id` int UNSIGNED NULL DEFAULT NULL COMMENT '商品ID',
  `shop_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商品名称',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商品图片',
  `num` int UNSIGNED NULL DEFAULT 0 COMMENT '数量',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `pay_coin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '幸运币抵扣',
  `pay_rmb` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '人民币支付',
  `delivery_fee` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '运费',
  `pay_method` enum('wechat','alipay','lucyk','sqfh','yue','sand') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '人民币支付方式:wechat=微信,alipay=支付宝,lucyk=幸运币,yue=余额,sand=杉德支付',
  `price` float NOT NULL COMMENT '商品单价',
  `out_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商户订单号',
  `record_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '盲盒商品订单号box_prize_record',
  `dzfooid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信平台订单号',
  `alipay_trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付宝订单号',
  `pay_time` int UNSIGNED NULL DEFAULT NULL COMMENT '付款时间',
  `status` enum('unpay','used','refund','ywc','undei') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpay' COMMENT '状态:unpay=待支付,used=待发货,refund=待收货,ywc=已完成,undei=已关闭',
  `desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '0' COMMENT '订单备注',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  `terminal` tinyint NULL DEFAULT 1 COMMENT '终端:0=h5,1=小程序,2=APP',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '收货地址',
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '收货人姓名',
  `mobile` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '收货人手机号',
  `kddh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递单号',
  `kdgs` enum('yuantong','yunda','shentong','zhongtong','jtexpress','shunfeng','youzhengguonei','ems','jd','debangkuaidi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '快递公司:yuantong=圆通速递,yunda=韵达快递,shentong=申通快递,zhongtong=中通快递,jtexpress=极兔速递,shunfeng=顺丰速运,youzhengguonei=邮政快递,ems=EMS,jd=京东物流,debangkuaidi=德邦快递',
  `express_time` int NULL DEFAULT NULL,
  `shipping_order_state` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `agent_lev1_uid` int NULL DEFAULT 0 COMMENT '上级uid',
  `agent_lev1_percent` decimal(6, 2) NULL DEFAULT 0.00 COMMENT '分佣百分比',
  `agent_lev1_price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '上级分佣',
  `agent_lev1_price_note` varchar(300) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '上级分佣备注',
  `agent_lev1_price_js` tinyint(1) NULL DEFAULT 2 COMMENT '上级是否结算:1=是,2=否',
  `agent_lev2_uid` int NULL DEFAULT 0 COMMENT '上上级uid',
  `agent_lev2_percent` decimal(6, 2) NULL DEFAULT 0.00 COMMENT '分佣百分比',
  `agent_lev2_price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '上上级分佣',
  `agent_lev2_price_note` varchar(300) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '上上级分佣备注',
  `agent_lev2_price_js` tinyint(1) NULL DEFAULT 2 COMMENT '上上级是否结算:1=是,2=否',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 54 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '盲盒购买订单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_shoporder_item
-- ----------------------------
DROP TABLE IF EXISTS `box_shoporder_item`;
CREATE TABLE `box_shoporder_item`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '申请提货订单Id',
  `goods_id` int NOT NULL COMMENT '商品ID',
  `goods_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '商品名称',
  `goods_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '商品图片',
  `goods_num` int UNSIGNED NOT NULL DEFAULT 1 COMMENT '商品数量',
  `goods_price` decimal(10, 2) UNSIGNED NULL DEFAULT NULL COMMENT '商品单价',
  `prize_record_id` int NULL DEFAULT NULL COMMENT '中奖商品id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 240 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '提货订单详情表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_sign
-- ----------------------------
DROP TABLE IF EXISTS `box_sign`;
CREATE TABLE `box_sign`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `sign_1` int NULL DEFAULT NULL COMMENT '签到第一天赠送金币',
  `sign_2` int NULL DEFAULT NULL COMMENT '签到第二天赠送金币',
  `sign_3` int NULL DEFAULT NULL COMMENT '签到第三天赠送金币',
  `sign_4` int NULL DEFAULT NULL COMMENT '签到第四天赠送金币',
  `sign_5` int NULL DEFAULT NULL COMMENT '签到第五天赠送金币',
  `sign_6` int NULL DEFAULT NULL COMMENT '签到第六天赠送金币',
  `boxfl_id` int NULL DEFAULT NULL COMMENT '签到第七天赠送盲盒',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_sign_jilu
-- ----------------------------
DROP TABLE IF EXISTS `box_sign_jilu`;
CREATE TABLE `box_sign_jilu`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `signtime` int NULL DEFAULT NULL COMMENT '签到时间',
  `count` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '累计签到天数',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 344 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_sms
-- ----------------------------
DROP TABLE IF EXISTS `box_sms`;
CREATE TABLE `box_sms`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `event` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '事件',
  `mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '手机号',
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '验证码',
  `times` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '验证次数',
  `ip` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'IP',
  `createtime` bigint UNSIGNED NULL DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '短信验证码表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_star
-- ----------------------------
DROP TABLE IF EXISTS `box_star`;
CREATE TABLE `box_star`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户ID',
  `box_id` int UNSIGNED NULL DEFAULT NULL COMMENT '盲盒ID',
  `create_time` int NULL DEFAULT NULL COMMENT '点赞时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户点赞收藏表' ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_task
-- ----------------------------
DROP TABLE IF EXISTS `box_task`;
CREATE TABLE `box_task`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务名称',
  `task_type` int UNSIGNED NULL DEFAULT 1 COMMENT '任务类型 1 消费任务,2 拉新任务 3 其他任务',
  `consume` decimal(8, 2) NULL DEFAULT NULL COMMENT '消费金额',
  `desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务描述',
  `status` enum('1','0') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '1' COMMENT '状态 1 正常 0 下架',
  `create_time` int NULL DEFAULT 0 COMMENT '创建时间',
  `update_time` int UNSIGNED NULL DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_task_detail
-- ----------------------------
DROP TABLE IF EXISTS `box_task_detail`;
CREATE TABLE `box_task_detail`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL COMMENT '任务ID',
  `award_type` enum('1','2','3') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '1' COMMENT '奖品类型 1 优惠券 2 道具卡 3 盲盒',
  `num` int UNSIGNED NULL DEFAULT 1 COMMENT '奖品数量',
  `award_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '奖品ID',
  `create_time` int UNSIGNED NULL DEFAULT 0 COMMENT '时间',
  `is_vip` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '会员专享',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '奖品',
  `desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '奖品描述',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '任务奖品' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_task_user
-- ----------------------------
DROP TABLE IF EXISTS `box_task_user`;
CREATE TABLE `box_task_user`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL COMMENT '任务ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `create_time` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户领取时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户任务领取表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_test
-- ----------------------------
DROP TABLE IF EXISTS `box_test`;
CREATE TABLE `box_test`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int NULL DEFAULT 0 COMMENT '会员ID',
  `admin_id` int NULL DEFAULT 0 COMMENT '管理员ID',
  `category_id` int UNSIGNED NULL DEFAULT 0 COMMENT '分类ID(单选)',
  `category_ids` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类ID(多选)',
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标签',
  `week` enum('monday','tuesday','wednesday') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '星期(单选):monday=星期一,tuesday=星期二,wednesday=星期三',
  `flag` set('hot','index','recommend') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标志(多选):hot=热门,index=首页,recommend=推荐',
  `genderdata` enum('male','female') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'male' COMMENT '性别(单选):male=男,female=女',
  `hobbydata` set('music','reading','swimming') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '爱好(多选):music=音乐,reading=读书,swimming=游泳',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '内容',
  `image` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '图片',
  `images` varchar(1500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '图片组',
  `attachfile` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '附件',
  `keywords` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '关键字',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '描述',
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '省市',
  `json` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '配置:key=名称,value=值',
  `multiplejson` varchar(1500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '二维数组:title=标题,intro=介绍,author=作者,age=年龄',
  `price` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '价格',
  `views` int UNSIGNED NULL DEFAULT 0 COMMENT '点击',
  `workrange` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '时间区间',
  `startdate` date NULL DEFAULT NULL COMMENT '开始日期',
  `activitytime` datetime NULL DEFAULT NULL COMMENT '活动时间(datetime)',
  `year` year NULL DEFAULT NULL COMMENT '年',
  `times` time NULL DEFAULT NULL COMMENT '时间',
  `refreshtime` bigint NULL DEFAULT NULL COMMENT '刷新时间',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `deletetime` bigint NULL DEFAULT NULL COMMENT '删除时间',
  `weigh` int NULL DEFAULT 0 COMMENT '权重',
  `switch` tinyint(1) NULL DEFAULT 0 COMMENT '开关',
  `status` enum('normal','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '状态',
  `state` enum('0','1','2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '1' COMMENT '状态值:0=禁用,1=正常,2=推荐',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '测试表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_text
-- ----------------------------
DROP TABLE IF EXISTS `box_text`;
CREATE TABLE `box_text`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标识',
  `desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标题',
  `text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '内容',
  `type` enum('rich_text','text') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rich_text' COMMENT '类别:rich_text=规则,text=活动',
  `public` tinyint(1) NULL DEFAULT 1 COMMENT '是否公共',
  `weigh` int NULL DEFAULT 0 COMMENT '排序权重，降序',
  `update_time` int NULL DEFAULT NULL COMMENT '更新时间',
  `status` enum('normal','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '状态:normal=显示,hidden=隐藏',
  `prize_ids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '领取优惠券',
  `prize_type` enum('coupon') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'coupon' COMMENT '领取类型:coupon=优惠券',
  `shortlink` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '协议规则表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_third
-- ----------------------------
DROP TABLE IF EXISTS `box_third`;
CREATE TABLE `box_third`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NULL DEFAULT 0 COMMENT '会员ID',
  `platform` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '第三方应用',
  `apptype` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '应用类型',
  `unionid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '第三方UNIONID',
  `openname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '第三方会员昵称',
  `openid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '第三方OPENID',
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT 'AccessToken',
  `refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'RefreshToken',
  `expires_in` int UNSIGNED NULL DEFAULT 0 COMMENT '有效期',
  `createtime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `logintime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '登录时间',
  `expiretime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '过期时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `platform`(`platform` ASC, `openid` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC, `platform` ASC) USING BTREE,
  INDEX `unionid`(`platform` ASC, `unionid` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '第三方登录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_uesr_sign_new
-- ----------------------------
DROP TABLE IF EXISTS `box_uesr_sign_new`;
CREATE TABLE `box_uesr_sign_new`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `signname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '奖励名称',
  `rewardtips` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '奖励提示',
  `sign_tx` int NULL DEFAULT NULL COMMENT '签到天数',
  `rewardvalue` int NULL DEFAULT NULL COMMENT '奖励值',
  `sign_reward_style` int NULL DEFAULT NULL COMMENT '签到奖励类型：10-道具卡，20-幸运币，30-优惠券,40-盲盒,50-烛星石',
  `box_id` int UNSIGNED NULL DEFAULT 0 COMMENT '宝箱',
  `relation_id` int NULL DEFAULT NULL COMMENT '关联奖品ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user
-- ----------------------------
DROP TABLE IF EXISTS `box_user`;
CREATE TABLE `box_user`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `group_id` int UNSIGNED NULL DEFAULT 0 COMMENT '组别ID',
  `username` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '用户名',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '昵称',
  `password` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '密码',
  `salt` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '密码盐',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '电子邮箱',
  `mobile` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '手机号',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '头像',
  `level` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '等级',
  `gender` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '性别',
  `birthday` date NULL DEFAULT NULL COMMENT '生日',
  `bio` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '格言',
  `money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '烛星石',
  `balance` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `score` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `successions` int UNSIGNED NOT NULL DEFAULT 1 COMMENT '连续登录天数',
  `maxsuccessions` int UNSIGNED NOT NULL DEFAULT 1 COMMENT '最大连续登录天数',
  `prevtime` bigint NULL DEFAULT NULL COMMENT '上次登录时间',
  `logintime` bigint NULL DEFAULT NULL COMMENT '登录时间',
  `loginip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '登录IP',
  `loginfailure` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '失败次数',
  `joinip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '加入IP',
  `jointime` bigint NULL DEFAULT NULL COMMENT '加入时间',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `token` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT 'Token',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '状态',
  `verification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '验证',
  `invitation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邀请码',
  `pid` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '上级用户ID',
  `wx_mini_openid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信小程序登录标识',
  `unionid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联合标识唯一id',
  `wx_app_openid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信APP登录标识',
  `wxunionid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信开放平台标识唯一id',
  `probabilitygj` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '高级商品概率',
  `probabilityxy` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '稀有商品概率',
  `probabilityss` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '史诗商品概率',
  `probabilitycs` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '传说商品概率',
  `fx1` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `fx2` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `fx3` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `fx_money` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_set_profile` tinyint(1) NULL DEFAULT 0 COMMENT '是否设置头像信息',
  `total_consume` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `vip_end_time` int NULL DEFAULT 0 COMMENT '会员到期时间',
  `is_log_off` tinyint(1) NULL DEFAULT 0 COMMENT '是否注销:0=否,1=是',
  `user_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `agent_money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '代理佣金',
  `qrcode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `agent_lev_id` int NULL DEFAULT 0 COMMENT '分销等级',
  `agent_lev1_uid` int NULL DEFAULT 0 COMMENT '上级id',
  `agent_lev2_uid` int NULL DEFAULT 0 COMMENT '上上级id',
  `wallet_left` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '可用佣金',
  `wallet_tx` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '已提现佣金',
  `agent` tinyint(1) NULL DEFAULT 2 COMMENT '分销员:1=是,2=否',
  `agent_qr` varchar(300) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '推广二维码',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `username`(`username` ASC) USING BTREE,
  INDEX `email`(`email` ASC) USING BTREE,
  INDEX `mobile`(`mobile` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9025 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_address
-- ----------------------------
DROP TABLE IF EXISTS `box_user_address`;
CREATE TABLE `box_user_address`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '姓名',
  `mobile` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `province` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '省',
  `city` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '市',
  `area` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '区',
  `detail` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '详细地址',
  `is_default` tinyint(1) NULL DEFAULT NULL COMMENT '是否是默认地址0否1是',
  `creattime` int NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 95 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci COMMENT = '用户收货地址表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_bank
-- ----------------------------
DROP TABLE IF EXISTS `box_user_bank`;
CREATE TABLE `box_user_bank`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `sk_bank` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '银行名称',
  `paixu` int NULL DEFAULT NULL COMMENT '排序',
  `beizhu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user_fragments
-- ----------------------------
DROP TABLE IF EXISTS `box_user_fragments`;
CREATE TABLE `box_user_fragments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `fragment_id` int NOT NULL COMMENT '碎片ID',
  `quantity` int NULL DEFAULT 0 COMMENT '拥有完整生肖数量',
  `total_synthesized` int NULL DEFAULT 0 COMMENT '累计合成生肖数量',
  `createtime` bigint NULL DEFAULT NULL COMMENT '首次获得时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_fragment`(`user_id` ASC, `fragment_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `fragment_id`(`fragment_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 38 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户生肖库存表(只保存完整生肖)' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user_group
-- ----------------------------
DROP TABLE IF EXISTS `box_user_group`;
CREATE TABLE `box_user_group`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '组名',
  `rules` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '权限节点',
  `createtime` bigint NULL DEFAULT NULL COMMENT '添加时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `status` enum('normal','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员组表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_level
-- ----------------------------
DROP TABLE IF EXISTS `box_user_level`;
CREATE TABLE `box_user_level`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `level_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '等级名称',
  `level_bs` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '等级标识',
  `is_default_level` int NULL DEFAULT NULL COMMENT '是否默认级别',
  `beizhu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user_money_log
-- ----------------------------
DROP TABLE IF EXISTS `box_user_money_log`;
CREATE TABLE `box_user_money_log`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '会员ID',
  `money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0.00' COMMENT '变更余额',
  `before` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0.00' COMMENT '变更前余额',
  `after` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0.00' COMMENT '变更后余额',
  `memo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '备注',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员余额变动表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_notification
-- ----------------------------
DROP TABLE IF EXISTS `box_user_notification`;
CREATE TABLE `box_user_notification`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '接收用户ID',
  `sender_id` int UNSIGNED NULL DEFAULT NULL COMMENT '发送者ID(系统通知为NULL)',
  `type` enum('order','community','system','message') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型:order=订单,community=社区,system=系统,message=私信',
  `sub_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '子类型:order_paid,order_shipped,post_liked,comment_replied等',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '通知内容',
  `related_id` int UNSIGNED NULL DEFAULT NULL COMMENT '关联ID(订单ID/帖子ID等)',
  `related_table` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '关联表名',
  `extra_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '额外数据(JSON格式)',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读:0=未读,1=已读',
  `read_time` bigint NULL DEFAULT NULL COMMENT '阅读时间',
  `is_deleted` tinyint(1) NULL DEFAULT 0 COMMENT '是否删除:0=正常,1=删除',
  `createtime` bigint NOT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_is_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_createtime`(`createtime` ASC) USING BTREE,
  INDEX `idx_user_read`(`user_id` ASC, `is_read` ASC) USING BTREE,
  INDEX `idx_related`(`related_table` ASC, `related_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user_rule
-- ----------------------------
DROP TABLE IF EXISTS `box_user_rule`;
CREATE TABLE `box_user_rule`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `pid` int NULL DEFAULT NULL COMMENT '父ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '名称',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '标题',
  `remark` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `ismenu` tinyint(1) NULL DEFAULT NULL COMMENT '是否菜单',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `weigh` int NULL DEFAULT 0 COMMENT '权重',
  `status` enum('normal','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员规则表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_score_log
-- ----------------------------
DROP TABLE IF EXISTS `box_user_score_log`;
CREATE TABLE `box_user_score_log`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '会员ID',
  `score` int NOT NULL DEFAULT 0 COMMENT '变更积分',
  `before` int NOT NULL DEFAULT 0 COMMENT '变更前积分',
  `after` int NOT NULL DEFAULT 0 COMMENT '变更后积分',
  `memo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '备注',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员积分变动表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_skstyle
-- ----------------------------
DROP TABLE IF EXISTS `box_user_skstyle`;
CREATE TABLE `box_user_skstyle`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int NULL DEFAULT NULL COMMENT '所属用户ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户名',
  `sk_skrxm` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人姓名',
  `sk_skrsfzh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人身份证号码',
  `sk_bank` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人开户银行',
  `sk_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款银行卡号',
  `status` enum('0','1') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态，0-停用，1-启用',
  `sk_create_time` int NULL DEFAULT NULL COMMENT '添加时间',
  `beizhu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user_token
-- ----------------------------
DROP TABLE IF EXISTS `box_user_token`;
CREATE TABLE `box_user_token`  (
  `token` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Token',
  `user_id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '会员ID',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `expiretime` bigint NULL DEFAULT NULL COMMENT '过期时间',
  PRIMARY KEY (`token`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员Token表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_user_tx
-- ----------------------------
DROP TABLE IF EXISTS `box_user_tx`;
CREATE TABLE `box_user_tx`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int NULL DEFAULT NULL COMMENT '提现用户',
  `tx_money` decimal(10, 2) NULL DEFAULT NULL COMMENT '提现金额',
  `tx_sxf` decimal(10, 2) NULL DEFAULT NULL COMMENT '提现手续费',
  `sjdz_money` decimal(10, 2) NULL DEFAULT NULL COMMENT '实际到账',
  `je_style` enum('10','20') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '金额类型：10-佣金，20-幸运币',
  `status` enum('0','1') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '审核状态：0-未通过，1-已通过',
  `sk_skrxm` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人姓名',
  `sk_skrsfzh` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人身份证号码',
  `sk_bank` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人开户银行',
  `sk_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '收款人银行卡号',
  `tx_createtime` bigint NULL DEFAULT NULL COMMENT '申请提现时间',
  `tx_passtime` bigint NULL DEFAULT NULL COMMENT '审核通过时间',
  `tx_jieguo` enum('0','1') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT NULL COMMENT '审核结果：0-审核失败，1-审核成功',
  `tx_beizhu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_user_wallet_log
-- ----------------------------
DROP TABLE IF EXISTS `box_user_wallet_log`;
CREATE TABLE `box_user_wallet_log`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户',
  `memo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '项目',
  `pay_money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '充值金额',
  `pay_method` enum('wechat','sand') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '充值方式:wechat=微信,sand=杉德支付',
  `createtime` int NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` int NULL DEFAULT NULL,
  `deletetime` int NULL DEFAULT NULL,
  `before_xs` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '星石变动前',
  `xs` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '星石变动',
  `after_xs` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '星石余额',
  `before_xyb` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '幸运币变动前',
  `xyb` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '幸运币变动',
  `after_xyb` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '幸运币余额',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 873 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '会员流水' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_uv
-- ----------------------------
DROP TABLE IF EXISTS `box_uv`;
CREATE TABLE `box_uv`  (
  `id` int NOT NULL COMMENT 'ID',
  `ip` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `createtime` int NULL DEFAULT NULL
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_version
-- ----------------------------
DROP TABLE IF EXISTS `box_version`;
CREATE TABLE `box_version`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `oldversion` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '旧版本号',
  `newversion` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '新版本号',
  `packagesize` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '包大小',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '升级内容',
  `downloadurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '下载地址',
  `enforce` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '强制更新',
  `createtime` bigint NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint NULL DEFAULT NULL COMMENT '更新时间',
  `weigh` int NOT NULL DEFAULT 0 COMMENT '权重',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '版本表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_virtuial
-- ----------------------------
DROP TABLE IF EXISTS `box_virtuial`;
CREATE TABLE `box_virtuial`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `username` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '用户名',
  `avatar` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '头像',
  `image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '商品图',
  `price` decimal(10, 2) NULL DEFAULT NULL COMMENT '价格',
  `add_time` int NULL DEFAULT NULL COMMENT '开盒时间',
  `goods_id` int NULL DEFAULT NULL COMMENT '商品id',
  `goods_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '商品名',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '开盒假数据' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_vuemagic
-- ----------------------------
DROP TABLE IF EXISTS `box_vuemagic`;
CREATE TABLE `box_vuemagic`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `type` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '类型',
  `params` varchar(1500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '参数',
  `vuemagic` varchar(1500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '命令',
  `content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL COMMENT '返回结果',
  `executetime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '执行时间',
  `createtime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '创建时间',
  `updatetime` bigint UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `status` enum('successed','failured') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'failured' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '在线命令表(vue+element)' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_wechat
-- ----------------------------
DROP TABLE IF EXISTS `box_wechat`;
CREATE TABLE `box_wechat`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '数据名',
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '值',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '描述',
  `updatetime` int NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '微信配置表' ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for box_withdrawal
-- ----------------------------
DROP TABLE IF EXISTS `box_withdrawal`;
CREATE TABLE `box_withdrawal`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `amount` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '金额',
  `type` enum('wechat','alipay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '提现方式:wechat=微信,alipay=支付宝',
  `drawal_type` tinyint NOT NULL DEFAULT 0 COMMENT '提现类型:0余额1佣金',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `account` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '账号',
  `status` enum('review','success','reject') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'review' COMMENT '状态:review=审核中,success=通过,reject=已驳回',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '驳回原因',
  `backend_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '后台已读标识:1已读,0未读',
  `create_time` int UNSIGNED NULL DEFAULT NULL COMMENT '申请时间',
  `update_time` int UNSIGNED NULL DEFAULT NULL COMMENT '更新时间',
  `delete_time` int UNSIGNED NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '提现记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for box_xcxpz
-- ----------------------------
DROP TABLE IF EXISTS `box_xcxpz`;
CREATE TABLE `box_xcxpz`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `platform` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标识',
  `con` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置',
  `note` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for box_yhbox
-- ----------------------------
DROP TABLE IF EXISTS `box_yhbox`;
CREATE TABLE `box_yhbox`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `boxfl_id` int NULL DEFAULT NULL COMMENT '盲盒ID',
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `status` int NULL DEFAULT NULL COMMENT '1未开启2已开启',
  `addtime` int NULL DEFAULT NULL COMMENT '添加时间',
  `opentime` int NULL DEFAULT NULL COMMENT '开启时间',
  `source` enum('qiandao','kami','renwu','sys') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NULL DEFAULT 'sys' COMMENT '来源:qiandao=签到,kami=兑换,renwu=任务,sys=系统',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 8 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_unicode_ci ROW_FORMAT = FIXED;

-- ----------------------------
-- Table structure for box_zz
-- ----------------------------
DROP TABLE IF EXISTS `box_zz`;
CREATE TABLE `box_zz`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '序号',
  `boxid` int NOT NULL COMMENT '盲盒ID',
  `boxgoods` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '盲盒商品',
  `zzuser` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '转赠人',
  `szuser` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '受赠人',
  `zhuanztime` timestamp NULL DEFAULT NULL COMMENT '转赠时间',
  `zzid` int NULL DEFAULT NULL COMMENT '转增ID',
  `zzimage` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = COMPACT;

-- ----------------------------
-- Table structure for t_logs
-- ----------------------------
DROP TABLE IF EXISTS `t_logs`;
CREATE TABLE `t_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `createDate` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updateDate` datetime NOT NULL,
  `msg` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_ucdata
-- ----------------------------
DROP TABLE IF EXISTS `t_ucdata`;
CREATE TABLE `t_ucdata`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `ua` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `ck` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `oaid` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `createDate` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updateDate` datetime NOT NULL,
  `imel` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pk` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef1` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef2` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef3` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef4` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef5` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef6` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cdef7` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
