-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 28, 2026 at 12:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `home_services`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `userId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `providerAccountId` varchar(191) NOT NULL,
  `refresh_token` text DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `expires_at` int(11) DEFAULT NULL,
  `token_type` varchar(191) DEFAULT NULL,
  `scope` varchar(191) DEFAULT NULL,
  `id_token` text DEFAULT NULL,
  `session_state` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `adminauditlog`
--

CREATE TABLE `adminauditlog` (
  `id` varchar(191) NOT NULL,
  `actorId` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `recordType` varchar(191) NOT NULL,
  `recordId` varchar(191) DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` varchar(191) NOT NULL,
  `bookingReference` varchar(191) NOT NULL,
  `customerId` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  `serviceAreaId` varchar(191) NOT NULL,
  `preferredDate` datetime(3) NOT NULL,
  `preferredTime` varchar(191) NOT NULL,
  `serviceAddress` text NOT NULL,
  `locality` varchar(191) NOT NULL,
  `problemDescription` text NOT NULL,
  `imageUrl` text DEFAULT NULL,
  `status` enum('REQUESTED','ACCEPTED','REJECTED','QUOTE_PENDING','QUOTE_ACCEPTED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','CANCELLED','DISPUTED') NOT NULL DEFAULT 'REQUESTED',
  `cancellationReason` text DEFAULT NULL,
  `cancelledBy` varchar(191) DEFAULT NULL,
  `cancelledAt` datetime(3) DEFAULT NULL,
  `finalServiceAmount` decimal(10,2) DEFAULT NULL,
  `customerPaymentStatus` enum('UNPAID','PENDING','PAID','REFUNDED','PARTIAL') NOT NULL DEFAULT 'UNPAID',
  `paymentMethod` varchar(191) DEFAULT NULL,
  `paymentReference` varchar(191) DEFAULT NULL,
  `paymentNotes` text DEFAULT NULL,
  `commissionRateSnapshot` decimal(5,4) NOT NULL DEFAULT 0.1200,
  `commissionAmount` decimal(10,2) DEFAULT NULL,
  `commissionReconciliationStatus` enum('PENDING','RECONCILED','DISPUTED') NOT NULL DEFAULT 'PENDING',
  `commissionReconciledAt` datetime(3) DEFAULT NULL,
  `commissionReconciledBy` varchar(191) DEFAULT NULL,
  `startedAt` datetime(3) DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `confirmedByCustomerAt` datetime(3) DEFAULT NULL,
  `disputedAt` datetime(3) DEFAULT NULL,
  `disputeReason` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `paymentOrderId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookingevent`
--

CREATE TABLE `bookingevent` (
  `id` varchar(191) NOT NULL,
  `bookingId` varchar(191) NOT NULL,
  `actorId` varchar(191) DEFAULT NULL,
  `previousState` enum('REQUESTED','ACCEPTED','REJECTED','QUOTE_PENDING','QUOTE_ACCEPTED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','CANCELLED','DISPUTED') DEFAULT NULL,
  `newState` enum('REQUESTED','ACCEPTED','REJECTED','QUOTE_PENDING','QUOTE_ACCEPTED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','CANCELLED','DISPUTED') NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `reason` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commissionrecord`
--

CREATE TABLE `commissionrecord` (
  `id` varchar(191) NOT NULL,
  `bookingId` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `agreedRate` decimal(5,4) NOT NULL,
  `amountDue` decimal(10,2) NOT NULL,
  `amountPaid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reconciliationStatus` enum('PENDING','RECONCILED','DISPUTED') NOT NULL DEFAULT 'PENDING',
  `reconciledAt` datetime(3) DEFAULT NULL,
  `reconciledBy` varchar(191) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `complaint`
--

CREATE TABLE `complaint` (
  `id` varchar(191) NOT NULL,
  `bookingId` varchar(191) DEFAULT NULL,
  `reporterId` varchar(191) NOT NULL,
  `complaintType` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `status` enum('OPEN','IN_PROGRESS','RESOLVED','CLOSED','DISMISSED') NOT NULL DEFAULT 'OPEN',
  `assignedToId` varchar(191) DEFAULT NULL,
  `assignedAt` datetime(3) DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `resolvedAt` datetime(3) DEFAULT NULL,
  `resolvedBy` varchar(191) DEFAULT NULL,
  `closedAt` datetime(3) DEFAULT NULL,
  `closedBy` varchar(191) DEFAULT NULL,
  `adminNotes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` varchar(191) NOT NULL,
  `recipientId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `relatedId` varchar(191) DEFAULT NULL,
  `relatedType` varchar(191) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `passwordresettoken`
--

CREATE TABLE `passwordresettoken` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `tokenHash` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `usedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quote`
--

CREATE TABLE `quote` (
  `id` varchar(191) NOT NULL,
  `bookingId` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `status` enum('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `visitFee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `labourAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `partsAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `otherCharges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL,
  `taxAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `totalAmount` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `customerNotes` text DEFAULT NULL,
  `validUntil` datetime(3) DEFAULT NULL,
  `sentAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `respondedAt` datetime(3) DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `rejectedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quoteitem`
--

CREATE TABLE `quoteitem` (
  `id` varchar(191) NOT NULL,
  `quoteId` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unitPrice` decimal(10,2) NOT NULL,
  `lineTotal` decimal(10,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `id` varchar(191) NOT NULL,
  `bookingId` varchar(191) NOT NULL,
  `customerId` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `isModerated` tinyint(1) NOT NULL DEFAULT 0,
  `moderatedBy` varchar(191) DEFAULT NULL,
  `moderatedAt` datetime(3) DEFAULT NULL,
  `moderationNotes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `servicearea`
--

CREATE TABLE `servicearea` (
  `id` varchar(191) NOT NULL,
  `city` varchar(191) NOT NULL,
  `locality` varchar(191) NOT NULL,
  `pincode` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `servicearea`
--

INSERT INTO `servicearea` (`id`, `city`, `locality`, `pincode`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmvrz2i300003623kczqttcde', 'Hyderabad', 'Madhapur', '500081', 1, '2026-10-28 10:29:12.589', '2026-10-28 10:29:12.589'),
('cmvrz2i300004623kdeiut27s', 'Hyderabad', 'Kukatpally', '500072', 1, '2026-10-28 10:29:12.589', '2026-10-28 10:29:12.589'),
('cmvrz2i300005623kfy013oug', 'Hyderabad', 'Gachibowli', '500032', 1, '2026-10-28 10:29:12.589', '2026-10-28 10:29:12.589'),
('cmvrz2i320006623kvowimm4t', 'Hyderabad', 'Secunderabad', '500003', 1, '2026-10-28 10:29:12.589', '2026-10-28 10:29:12.589');

-- --------------------------------------------------------

--
-- Table structure for table `servicecategory`
--

CREATE TABLE `servicecategory` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `iconKey` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `indicativeMin` decimal(10,2) DEFAULT NULL,
  `indicativeMax` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `servicecategory`
--

INSERT INTO `servicecategory` (`id`, `name`, `slug`, `description`, `iconKey`, `isActive`, `sortOrder`, `indicativeMin`, `indicativeMax`, `createdAt`, `updatedAt`) VALUES
('cmvrz2i2u0000623kxwoppbj2', 'Electrician', 'electrician', 'Home wiring, repairs, and installations', 'zap', 1, 1, 299.00, 2500.00, '2026-10-28 10:29:12.583', '2026-10-28 10:29:12.583'),
('cmvrz2i2w0001623k4yyym0bg', 'Plumbing', 'plumbing', 'Leaks, blockages, and fittings', 'droplets', 1, 3, 249.00, 2000.00, '2026-10-28 10:29:12.583', '2026-10-28 10:29:12.583'),
('cmvrz2i2w0002623k6dq5eyxq', 'AC repair', 'ac-repair', 'Servicing, gas refill, and breakdown fixes', 'snowflake', 1, 2, 399.00, 3500.00, '2026-10-28 10:29:12.583', '2026-10-28 10:29:12.583');

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `sessionToken` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `technicianavailability`
--

CREATE TABLE `technicianavailability` (
  `id` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `dayOfWeek` int(11) NOT NULL,
  `startTime` varchar(191) NOT NULL,
  `endTime` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `technicianavailability`
--

INSERT INTO `technicianavailability` (`id`, `technicianId`, `dayOfWeek`, `startTime`, `endTime`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmvrz2i7j000u623k55ufepa2', 'cmvrz2i4p000j623kcuwlfdlu', 1, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j000v623k60mf9x4o', 'cmvrz2i4p000j623kcuwlfdlu', 2, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j000w623kic3vs6sj', 'cmvrz2i4p000j623kcuwlfdlu', 3, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j000x623khtxx7i8f', 'cmvrz2i4p000j623kcuwlfdlu', 4, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j000y623k2q4shuv4', 'cmvrz2i4p000j623kcuwlfdlu', 5, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j000z623kvhsvlpgb', 'cmvrz2i4p000j623kcuwlfdlu', 6, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0010623k18zw8axu', 'cmvrz2i4p000k623krqovgwa1', 1, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0011623klo9ubybv', 'cmvrz2i4p000k623krqovgwa1', 2, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0012623ksix27cwv', 'cmvrz2i4p000k623krqovgwa1', 3, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0013623k9cel5fv1', 'cmvrz2i4p000k623krqovgwa1', 4, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0014623k8h0zj523', 'cmvrz2i4p000k623krqovgwa1', 5, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0015623kgk8ozysl', 'cmvrz2i4p000k623krqovgwa1', 6, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0016623krluo0zh0', 'cmvrz2i4p000h623kpw7kdo5j', 1, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0017623kj3eask6x', 'cmvrz2i4p000h623kpw7kdo5j', 2, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0018623kr6oylx8g', 'cmvrz2i4p000h623kpw7kdo5j', 3, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j0019623k1c5xx7tl', 'cmvrz2i4p000h623kpw7kdo5j', 4, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j001a623krzu7iwch', 'cmvrz2i4p000h623kpw7kdo5j', 5, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751'),
('cmvrz2i7j001b623k93we3n7g', 'cmvrz2i4p000h623kpw7kdo5j', 6, '09:00', '18:00', 1, '2026-10-28 10:29:12.751', '2026-10-28 10:29:12.751');

-- --------------------------------------------------------

--
-- Table structure for table `technicianprofile`
--

CREATE TABLE `technicianprofile` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `bio` text DEFAULT NULL,
  `experienceYears` int(11) NOT NULL DEFAULT 0,
  `profileImageUrl` text DEFAULT NULL,
  `applicationStatus` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `verificationStatus` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `adminNotes` text DEFAULT NULL,
  `approvedById` varchar(191) DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL,
  `rejectedAt` datetime(3) DEFAULT NULL,
  `suspendedAt` datetime(3) DEFAULT NULL,
  `suspensionReason` text DEFAULT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `ratingAverage` decimal(3,2) DEFAULT NULL,
  `ratingCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `technicianprofile`
--

INSERT INTO `technicianprofile` (`id`, `userId`, `bio`, `experienceYears`, `profileImageUrl`, `applicationStatus`, `verificationStatus`, `adminNotes`, `approvedById`, `approvedAt`, `rejectionReason`, `rejectedAt`, `suspendedAt`, `suspensionReason`, `isVerified`, `ratingAverage`, `ratingCount`, `createdAt`, `updatedAt`) VALUES
('cmvrz2i4p000h623kpw7kdo5j', 'cmvrz2i4k000b623k24474o86', 'Plumber covering Madhapur and Gachibowli.', 5, NULL, 'APPROVED', 'APPROVED', NULL, 'cmvrz2i4d0007623k0w2wwbgx', '2026-10-28 10:29:12.645', NULL, NULL, NULL, NULL, 1, 4.70, 7, '2026-10-28 10:29:12.650', '2026-10-28 10:29:12.650'),
('cmvrz2i4p000i623khrmnz37u', 'cmvrz2i4k000c623kc23ikij0', 'Awaiting document verification.', 2, NULL, 'PENDING', 'PENDING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, '2026-10-28 10:29:12.650', '2026-10-28 10:29:12.650'),
('cmvrz2i4p000j623kcuwlfdlu', 'cmvrz2i4k0009623kgvxlm3gu', 'Licensed electrician with 8 years experience in Hyderabad apartments.', 8, NULL, 'APPROVED', 'APPROVED', NULL, 'cmvrz2i4d0007623k0w2wwbgx', '2026-10-28 10:29:12.645', NULL, NULL, NULL, NULL, 1, 4.80, 12, '2026-10-28 10:29:12.650', '2026-10-28 10:29:12.650'),
('cmvrz2i4p000k623krqovgwa1', 'cmvrz2i4k000a623k1x0fsiqh', 'AC specialist for split and window units.', 6, NULL, 'APPROVED', 'APPROVED', NULL, 'cmvrz2i4d0007623k0w2wwbgx', '2026-10-28 10:29:12.645', NULL, NULL, NULL, NULL, 1, 4.60, 9, '2026-10-28 10:29:12.650', '2026-10-28 10:29:12.650');

-- --------------------------------------------------------

--
-- Table structure for table `technicianservice`
--

CREATE TABLE `technicianservice` (
  `id` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  `visitFee` decimal(10,2) DEFAULT NULL,
  `labourMin` decimal(10,2) DEFAULT NULL,
  `labourMax` decimal(10,2) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `technicianservice`
--

INSERT INTO `technicianservice` (`id`, `technicianId`, `categoryId`, `visitFee`, `labourMin`, `labourMax`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmvrz2i65000l623kwktnact8', 'cmvrz2i4p000j623kcuwlfdlu', 'cmvrz2i2u0000623kxwoppbj2', 199.00, 300.00, 2000.00, 1, '2026-10-28 10:29:12.701', '2026-10-28 10:29:12.701'),
('cmvrz2i65000m623k06d99h75', 'cmvrz2i4p000k623krqovgwa1', 'cmvrz2i2w0002623k6dq5eyxq', 249.00, 400.00, 3000.00, 1, '2026-10-28 10:29:12.701', '2026-10-28 10:29:12.701'),
('cmvrz2i65000n623kubjiu7fl', 'cmvrz2i4p000h623kpw7kdo5j', 'cmvrz2i2w0001623k4yyym0bg', 179.00, 250.00, 1800.00, 1, '2026-10-28 10:29:12.701', '2026-10-28 10:29:12.701');

-- --------------------------------------------------------

--
-- Table structure for table `technicianservicearea`
--

CREATE TABLE `technicianservicearea` (
  `id` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `areaId` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `technicianservicearea`
--

INSERT INTO `technicianservicearea` (`id`, `technicianId`, `areaId`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmvrz2i7e000o623kdcwhmuh3', 'cmvrz2i4p000j623kcuwlfdlu', 'cmvrz2i300003623kczqttcde', 1, '2026-10-28 10:29:12.747', '2026-10-28 10:29:12.747'),
('cmvrz2i7e000p623kzvcb4xqm', 'cmvrz2i4p000j623kcuwlfdlu', 'cmvrz2i300005623kfy013oug', 1, '2026-10-28 10:29:12.747', '2026-10-28 10:29:12.747'),
('cmvrz2i7e000q623krm0wdw3q', 'cmvrz2i4p000k623krqovgwa1', 'cmvrz2i300004623kdeiut27s', 1, '2026-10-28 10:29:12.747', '2026-10-28 10:29:12.747'),
('cmvrz2i7e000r623k3r6yblva', 'cmvrz2i4p000k623krqovgwa1', 'cmvrz2i300005623kfy013oug', 1, '2026-10-28 10:29:12.747', '2026-10-28 10:29:12.747'),
('cmvrz2i7f000s623km699gyuo', 'cmvrz2i4p000h623kpw7kdo5j', 'cmvrz2i300003623kczqttcde', 1, '2026-10-28 10:29:12.747', '2026-10-28 10:29:12.747'),
('cmvrz2i7f000t623kcben4vxy', 'cmvrz2i4p000h623kpw7kdo5j', 'cmvrz2i300005623kfy013oug', 1, '2026-10-28 10:29:12.747', '2026-10-28 10:29:12.747');

-- --------------------------------------------------------

--
-- Table structure for table `technicianverificationdocument`
--

CREATE TABLE `technicianverificationdocument` (
  `id` varchar(191) NOT NULL,
  `technicianId` varchar(191) NOT NULL,
  `documentType` varchar(191) NOT NULL,
  `documentUrl` text NOT NULL,
  `fileName` varchar(191) DEFAULT NULL,
  `fileSize` int(11) DEFAULT NULL,
  `mimeType` varchar(191) DEFAULT NULL,
  `uploadedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `verifiedAt` datetime(3) DEFAULT NULL,
  `verifiedBy` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `passwordHash` varchar(191) DEFAULT NULL,
  `role` enum('CUSTOMER','TECHNICIAN','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `accountStatus` enum('ACTIVE','SUSPENDED','PENDING','REJECTED') NOT NULL DEFAULT 'ACTIVE',
  `emailVerified` datetime(3) DEFAULT NULL,
  `image` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `lastLoginAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `phone`, `passwordHash`, `role`, `accountStatus`, `emailVerified`, `image`, `createdAt`, `updatedAt`, `lastLoginAt`) VALUES
('cmvrz2i4d0007623k0w2wwbgx', 'FixNear Admin', 'admin@fixnear.in', '+919876543210', '$2b$10$BziJ0eMmvftajiYx5i6Tq.4RX7YWov.xAf81VQak6k52DnN/DzNxm', 'ADMIN', 'ACTIVE', NULL, NULL, '2026-10-28 10:29:12.638', '2026-10-28 10:29:12.638', NULL),
('cmvrz2i4h0008623kkdkfz76p', 'Priya Sharma', 'customer@example.com', '+919888877766', '$2b$10$BziJ0eMmvftajiYx5i6Tq.4RX7YWov.xAf81VQak6k52DnN/DzNxm', 'CUSTOMER', 'ACTIVE', NULL, NULL, '2026-10-28 10:29:12.641', '2026-10-28 10:29:12.641', NULL),
('cmvrz2i4k0009623kgvxlm3gu', 'Ravi Kumar', 'ravi.electric@example.com', '+919777766655', '$2b$10$BziJ0eMmvftajiYx5i6Tq.4RX7YWov.xAf81VQak6k52DnN/DzNxm', 'TECHNICIAN', 'ACTIVE', NULL, NULL, '2026-10-28 10:29:12.644', '2026-10-28 10:29:12.644', NULL),
('cmvrz2i4k000a623k1x0fsiqh', 'Anil Reddy', 'anil.ac@example.com', '+919666655544', '$2b$10$BziJ0eMmvftajiYx5i6Tq.4RX7YWov.xAf81VQak6k52DnN/DzNxm', 'TECHNICIAN', 'ACTIVE', NULL, NULL, '2026-10-28 10:29:12.644', '2026-10-28 10:29:12.644', NULL),
('cmvrz2i4k000b623k24474o86', 'Suresh Rao', 'suresh.plumb@example.com', '+919555544433', '$2b$10$BziJ0eMmvftajiYx5i6Tq.4RX7YWov.xAf81VQak6k52DnN/DzNxm', 'TECHNICIAN', 'ACTIVE', NULL, NULL, '2026-10-28 10:29:12.644', '2026-10-28 10:29:12.644', NULL),
('cmvrz2i4k000c623kc23ikij0', 'New Applicant', 'pending.tech@example.com', '+919444433322', '$2b$10$BziJ0eMmvftajiYx5i6Tq.4RX7YWov.xAf81VQak6k52DnN/DzNxm', 'TECHNICIAN', 'PENDING', NULL, NULL, '2026-10-28 10:29:12.644', '2026-10-28 10:29:12.644', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `verificationtoken`
--

CREATE TABLE `verificationtoken` (
  `identifier` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('11ae11b8-3c72-4d23-95c1-147105427b8c', '0fe96df82f2cb06af7226b3b3d692b103d9a9ec63c975638c91da74f9ebf7966', '2026-10-28 05:45:29.391', '20261028054525_init_mysql', NULL, NULL, '2026-10-28 05:45:25.350', 1),
('4a7248c4-7d69-4c8c-a3f8-576e34db6254', '98041b96b3c58926a7ac7df3ab8b46ca134bbbb551441a808b7c2e6af3f5695e', '2026-10-28 09:38:15.085', '20261028093814_marketplace_features', NULL, NULL, '2026-10-28 09:38:14.884', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`provider`,`providerAccountId`),
  ADD KEY `Account_userId_fkey` (`userId`);

--
-- Indexes for table `adminauditlog`
--
ALTER TABLE `adminauditlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AdminAuditLog_actorId_createdAt_idx` (`actorId`,`createdAt`),
  ADD KEY `AdminAuditLog_recordType_recordId_idx` (`recordType`,`recordId`);

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Booking_bookingReference_key` (`bookingReference`),
  ADD KEY `Booking_customerId_createdAt_idx` (`customerId`,`createdAt`),
  ADD KEY `Booking_technicianId_createdAt_idx` (`technicianId`,`createdAt`),
  ADD KEY `Booking_status_createdAt_idx` (`status`,`createdAt`),
  ADD KEY `Booking_serviceAreaId_idx` (`serviceAreaId`),
  ADD KEY `Booking_categoryId_idx` (`categoryId`),
  ADD KEY `Booking_technicianId_preferredDate_idx` (`technicianId`,`preferredDate`);

--
-- Indexes for table `bookingevent`
--
ALTER TABLE `bookingevent`
  ADD PRIMARY KEY (`id`),
  ADD KEY `BookingEvent_bookingId_timestamp_idx` (`bookingId`,`timestamp`);

--
-- Indexes for table `commissionrecord`
--
ALTER TABLE `commissionrecord`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `CommissionRecord_bookingId_key` (`bookingId`),
  ADD KEY `CommissionRecord_technicianId_reconciliationStatus_idx` (`technicianId`,`reconciliationStatus`),
  ADD KEY `CommissionRecord_reconciliationStatus_idx` (`reconciliationStatus`);

--
-- Indexes for table `complaint`
--
ALTER TABLE `complaint`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Complaint_reporterId_idx` (`reporterId`),
  ADD KEY `Complaint_status_idx` (`status`),
  ADD KEY `Complaint_assignedToId_idx` (`assignedToId`),
  ADD KEY `Complaint_bookingId_fkey` (`bookingId`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Notification_recipientId_isRead_createdAt_idx` (`recipientId`,`isRead`,`createdAt`),
  ADD KEY `Notification_relatedType_relatedId_idx` (`relatedType`,`relatedId`);

--
-- Indexes for table `passwordresettoken`
--
ALTER TABLE `passwordresettoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PasswordResetToken_tokenHash_key` (`tokenHash`),
  ADD KEY `PasswordResetToken_userId_idx` (`userId`);

--
-- Indexes for table `quote`
--
ALTER TABLE `quote`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Quote_bookingId_version_idx` (`bookingId`,`version`),
  ADD KEY `Quote_status_idx` (`status`),
  ADD KEY `Quote_technicianId_fkey` (`technicianId`);

--
-- Indexes for table `quoteitem`
--
ALTER TABLE `quoteitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `QuoteItem_quoteId_idx` (`quoteId`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Review_bookingId_key` (`bookingId`),
  ADD KEY `Review_technicianId_rating_idx` (`technicianId`,`rating`),
  ADD KEY `Review_rating_idx` (`rating`),
  ADD KEY `Review_customerId_fkey` (`customerId`);

--
-- Indexes for table `servicearea`
--
ALTER TABLE `servicearea`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ServiceArea_city_locality_key` (`city`,`locality`);

--
-- Indexes for table `servicecategory`
--
ALTER TABLE `servicecategory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ServiceCategory_slug_key` (`slug`);

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`sessionToken`),
  ADD KEY `Session_userId_fkey` (`userId`);

--
-- Indexes for table `technicianavailability`
--
ALTER TABLE `technicianavailability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TechnicianAvailability_technicianId_dayOfWeek_idx` (`technicianId`,`dayOfWeek`);

--
-- Indexes for table `technicianprofile`
--
ALTER TABLE `technicianprofile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TechnicianProfile_userId_key` (`userId`),
  ADD KEY `TechnicianProfile_verificationStatus_applicationStatus_idx` (`verificationStatus`,`applicationStatus`),
  ADD KEY `TechnicianProfile_ratingAverage_idx` (`ratingAverage`);

--
-- Indexes for table `technicianservice`
--
ALTER TABLE `technicianservice`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TechnicianService_technicianId_categoryId_key` (`technicianId`,`categoryId`),
  ADD KEY `TechnicianService_technicianId_idx` (`technicianId`),
  ADD KEY `TechnicianService_categoryId_idx` (`categoryId`);

--
-- Indexes for table `technicianservicearea`
--
ALTER TABLE `technicianservicearea`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TechnicianServiceArea_technicianId_areaId_key` (`technicianId`,`areaId`),
  ADD KEY `TechnicianServiceArea_technicianId_idx` (`technicianId`),
  ADD KEY `TechnicianServiceArea_areaId_idx` (`areaId`);

--
-- Indexes for table `technicianverificationdocument`
--
ALTER TABLE `technicianverificationdocument`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TechnicianVerificationDocument_technicianId_idx` (`technicianId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- Indexes for table `verificationtoken`
--
ALTER TABLE `verificationtoken`
  ADD PRIMARY KEY (`identifier`,`token`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account`
--
ALTER TABLE `account`
  ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `adminauditlog`
--
ALTER TABLE `adminauditlog`
  ADD CONSTRAINT `AdminAuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `Booking_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `servicecategory` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_serviceAreaId_fkey` FOREIGN KEY (`serviceAreaId`) REFERENCES `servicearea` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `bookingevent`
--
ALTER TABLE `bookingevent`
  ADD CONSTRAINT `BookingEvent_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `commissionrecord`
--
ALTER TABLE `commissionrecord`
  ADD CONSTRAINT `CommissionRecord_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `CommissionRecord_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `complaint`
--
ALTER TABLE `complaint`
  ADD CONSTRAINT `Complaint_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Complaint_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Complaint_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `Notification_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `passwordresettoken`
--
ALTER TABLE `passwordresettoken`
  ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `quote`
--
ALTER TABLE `quote`
  ADD CONSTRAINT `Quote_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Quote_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `quoteitem`
--
ALTER TABLE `quoteitem`
  ADD CONSTRAINT `QuoteItem_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `quote` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `Review_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `technicianavailability`
--
ALTER TABLE `technicianavailability`
  ADD CONSTRAINT `TechnicianAvailability_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `technicianprofile`
--
ALTER TABLE `technicianprofile`
  ADD CONSTRAINT `TechnicianProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `technicianservice`
--
ALTER TABLE `technicianservice`
  ADD CONSTRAINT `TechnicianService_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `servicecategory` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `TechnicianService_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `technicianservicearea`
--
ALTER TABLE `technicianservicearea`
  ADD CONSTRAINT `TechnicianServiceArea_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `servicearea` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `TechnicianServiceArea_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `technicianverificationdocument`
--
ALTER TABLE `technicianverificationdocument`
  ADD CONSTRAINT `TechnicianVerificationDocument_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `technicianprofile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
