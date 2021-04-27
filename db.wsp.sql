-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 08, 2021 at 06:27 PM
-- Server version: 8.0.22
-- PHP Version: 7.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_escrowbot_wsp`
--

-- --------------------------------------------------------

--
-- Table structure for table `bot_wsp_cambios`
--

DROP TABLE IF EXISTS `bot_wsp_cambios`;
CREATE TABLE IF NOT EXISTS `bot_wsp_cambios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(45) NOT NULL,
  `original` varchar(255) NOT NULL,
  `reemplazo` varchar(255) NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bot_wsp_confidencias`
--

DROP TABLE IF EXISTS `bot_wsp_confidencias`;
CREATE TABLE IF NOT EXISTS `bot_wsp_confidencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_confiado` varchar(64) DEFAULT NULL,
  `usuario_confidente` varchar(64) DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `confidente_idx` (`usuario_confiado`),
  KEY `confidente_idx1` (`usuario_confidente`)
) ENGINE=InnoDB AUTO_INCREMENT=640 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bot_wsp_contratos`
--

DROP TABLE IF EXISTS `bot_wsp_contratos`;
CREATE TABLE IF NOT EXISTS `bot_wsp_contratos` (
  `id` int NOT NULL,
  `satoshis` bigint NOT NULL,
  `garante` bigint NOT NULL,
  `garantizado` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bot_wsp_usuarios`
--

DROP TABLE IF EXISTS `bot_wsp_usuarios`;
CREATE TABLE IF NOT EXISTS `bot_wsp_usuarios` (
  `wspid_hash` varchar(64) NOT NULL,
  `wspid` varchar(64) NOT NULL,
  `id` int(13) NOT NULL AUTO_INCREMENT,
  `satoshis` bigint DEFAULT '0',
  `bloqueado` tinyint DEFAULT '0',
  `name` varchar(255) DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wspid_hash`),
  KEY (`id`),
  UNIQUE KEY `wspid_hash_UNIQUE` (`wspid_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bot_wsp_confidencias`
--
ALTER TABLE `bot_wsp_confidencias`
  ADD CONSTRAINT `wsp_confiado` FOREIGN KEY (`usuario_confiado`) REFERENCES `bot_wsp_usuarios` (`wspid_hash`),
  ADD CONSTRAINT `wsp_confidente` FOREIGN KEY (`usuario_confidente`) REFERENCES `bot_wsp_usuarios` (`wspid_hash`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
