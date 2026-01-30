// src/modules/report/repositories/report.repository.ts
import { singleton } from "tsyringe";
import { Report, ReportMedia, ReportType } from "@prisma/client";
import { prisma } from "../../../common/config/database";

@singleton()
export class ReportRepository {

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
   * 신고 ID로 조회 
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

  /**
   * 사용자별 신고 목록 조회
   */
  async findReportsByUserId(
    userId: bigint,
    page: number,
    size: number,
    sort: "latest" | "oldest" = "latest"
  ) {
    const skip = (page - 1) * size;
    const orderBy = sort === "latest" ? { createdAt: 'desc' as const } : { createdAt: 'asc' as const };
    
    return prisma.report.findMany({
      where: { userId },
      skip,
      take: size,
      orderBy,
    });
  }

  /**
   * 사용자별 신고 총 개수
   */
  async countReportsByUserId(userId: bigint) {
    return prisma.report.count({
      where: { userId },
    });
  }

  /**
   * 신고 수정
   */
  async updateReport(
    reportId: bigint,
    data: {
      title?: string;
      content?: string;
      email?: string | null;
    }
  ) {
    return prisma.report.update({
      where: { id: reportId },
      data,
      include: {
        medias: {
          orderBy: {
            uploadAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * 신고 미디어 전체 삭제
   */
  async deleteReportMedias(reportId: bigint) {
    return prisma.reportMedia.deleteMany({
      where: { reportId },
    });
  }

  /**
   * 신고 미디어 추가
   */
  async createReportMedias(reportId: bigint, mediaUrls: string[]) {
    if (mediaUrls.length === 0) return;
    
    return prisma.reportMedia.createMany({
      data: mediaUrls.map((url) => ({
        reportId,
        mediaUrl: url,
      })),
    });
  }

  /**
   * 신고 삭제
   */
  async deleteReport(reportId: bigint) {
    return prisma.report.delete({
      where: { id: reportId },
    });
  }
}
