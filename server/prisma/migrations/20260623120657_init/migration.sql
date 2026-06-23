-- CreateEnum
CREATE TYPE "AmbulanceStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFFLINE');

-- CreateEnum
CREATE TYPE "AmbulanceRequestStatus" AS ENUM ('REQUESTED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ambulances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "status" "AmbulanceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambulances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambulance_requests" (
    "id" TEXT NOT NULL,
    "emergencyRequestId" TEXT NOT NULL,
    "responseId" TEXT,
    "organizationId" TEXT NOT NULL,
    "ambulanceId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "status" "AmbulanceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambulance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ambulances_organizationId_status_idx" ON "ambulances"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ambulances_organizationId_vehicleNumber_key" ON "ambulances"("organizationId", "vehicleNumber");

-- CreateIndex
CREATE INDEX "ambulance_requests_organizationId_status_idx" ON "ambulance_requests"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ambulance_requests_emergencyRequestId_idx" ON "ambulance_requests"("emergencyRequestId");

-- AddForeignKey
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_requests" ADD CONSTRAINT "ambulance_requests_emergencyRequestId_fkey" FOREIGN KEY ("emergencyRequestId") REFERENCES "emergency_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_requests" ADD CONSTRAINT "ambulance_requests_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "request_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_requests" ADD CONSTRAINT "ambulance_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_requests" ADD CONSTRAINT "ambulance_requests_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "ambulances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_requests" ADD CONSTRAINT "ambulance_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
