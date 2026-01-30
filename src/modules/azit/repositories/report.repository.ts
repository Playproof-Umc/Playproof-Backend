// src/modules/azit/repositories/report.repository.ts
import { singleton } from "tsyringe";
import { Report, ReportMedia, ReportType } from "@prisma/client";
import { prisma } from "../../../common/config/database";

@singleton()
export class ReportRepository {
  /**
   * 신고 생성 및 미디어 일괄 생성
   */
  async createReportWithMedias(
    userId: bigint,
    targetId: bigint,
    name: string,
    email: string | null,
    reportType: ReportType,
    title: string,
    content: string,
    mediaUrls: string[],
  ): Promise<Report> {
    return prisma.$transaction(async (tx) => {
      // 1. 신고 생성
      const report = await tx.report.create({
        data: {
          userId,
          targetId,
          name,
          email: email || null,
          reportType,
          title,
          content,
        },
      });

      // 2. 미디어 일괄 생성
      if (mediaUrls.length > 0) {
        await tx.reportMedia.createMany({
          data: mediaUrls.map((url) => ({
            reportId: report.id,
            mediaUrl: url,
          })),
        });
      }

      return report;
    });
  }

  /**
   * 신고 ID로 조회 (상세 정보 포함)
   */
  async findReportById(reportId: bigint) {
    return prisma.report.findUnique({
      where: {
        id: reportId,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        target: {
          select: {
            id: true,
            nickname: true,
          },
        },
        medias: {
          orderBy: {
            uploadAt: 'asc',
          },
        },
      },
    });
  }
}
