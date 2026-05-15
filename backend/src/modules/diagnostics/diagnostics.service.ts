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
    "Implant sozlamalarini tekshirish kerak bo'lishi mumkin",
    "Kundalik mashqlarni qisqa va tez-tez o'tkazing",
  ];
}

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

  getQuestions() {
    return { questions: [...DIAGNOSTICS_QUESTIONS] };
  }

  async submit(user: AuthenticatedUser, childId: string, dto: SubmitDiagnosticsDto) {
    const child = await this.children.ensureAccess(user, childId);
    if (dto.answers.length !== DIAGNOSTICS_QUESTIONS.length) {
      throw new BadRequestException(`answers must contain exactly ${DIAGNOSTICS_QUESTIONS.length} items`);
    }

    const score = dto.answers.reduce((acc, v) => acc + v, 0);
    const maxScore = DIAGNOSTICS_QUESTIONS.length * 2;
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
