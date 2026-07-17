-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "backupDoctorId" INTEGER;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_backupDoctorId_fkey" FOREIGN KEY ("backupDoctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
