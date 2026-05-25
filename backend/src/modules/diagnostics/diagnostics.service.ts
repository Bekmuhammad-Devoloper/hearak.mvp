import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenService } from '../children/children.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DIAGNOSTICS_QUESTIONS } from '../../common/constants/exercises';
import { SubmitDiagnosticsDto } from './dto/submit-diagnostics.dto';

function recommendationsForScore(pct: number): string[] {
  if (pct >= 80) {
    return [
      'Har kuni 5 daqiqalik mashqlarni davom eting',
      "Bola bilan ko'proq suhbatlashing",
      'Mutaxassis bilan keyingi uchrashuvni rejalashtiring',
    ];
  }
  if (pct >= 50) {
    return [
      "Eshitish mashqlariga e'tiborni oshiring",
      'Tabiat tovushlarini hayotga olib kiring',
      "Mutaxassis bilan haftalik aloqada bo'ling",
    ];
  }
  return [
    'Iloji boricha tezroq mutaxassisga murojaat qiling',
    "Eshitish qurilmasi (implant yoki apparat) sozlamalarini audiolog bilan tekshiring",
    "Kundalik mashqlarni qisqa va tez-tez o'tkazing",
  ];
}

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  async getQuestions() {
    const active = await this.prisma.diagnosticsQuestion.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { text: true },
    });
    // Boshlang'ich seed admin paneliga birinchi kirilganda yoki seed
    // skriptidan yuklanadi. DB hali bo'sh bo'lsa — eski statik ro'yxatni
    // ko'rsatamiz va submit ham shunga moslashadi.
    const questions = active.length > 0 ? active.map((q) => q.text) : [...DIAGNOSTICS_QUESTIONS];
    return { questions };
  }

  private async loadActiveQuestionsCount(): Promise<number> {
    const count = await this.prisma.diagnosticsQuestion.count({ where: { active: true } });
    return count > 0 ? count : DIAGNOSTICS_QUESTIONS.length;
  }

  async submit(user: AuthenticatedUser, childId: string, dto: SubmitDiagnosticsDto) {
    const child = await this.children.ensureAccess(user, childId);
    const questionCount = await this.loadActiveQuestionsCount();
    if (dto.answers.length !== questionCount) {
      throw new BadRequestException(`answers must contain exactly ${questionCount} items`);
    }

    const score = dto.answers.reduce((acc, v) => acc + v, 0);
    const maxScore = questionCount * 2;
    const pct = Math.round((score / maxScore) * 100);
    const recommendations = recommendationsForScore(pct);

    const submission = await this.prisma.diagnosticsSubmission.create({
      data: {
        childId: child.id,
        answers: JSON.stringify(dto.answers),
        score,
        maxScore,
        pct,
        recommendations: JSON.stringify(recommendations),
      },
    });

    return {
      id: submission.id,
      childId: submission.childId,
      answers: dto.answers,
      score: submission.score,
      maxScore: submission.maxScore,
      pct: submission.pct,
      recommendations,
      submittedAt: submission.submittedAt.toISOString(),
    };
  }
}
