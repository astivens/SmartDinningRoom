import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Rating, Student, User } from '../models';

export const createRating = async (req: AuthRequest, res: Response) => {
  try {
    const { stars, comment } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const student = await Student.findOne({ where: { userId: studentId } });
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const rating = await Rating.create({
      studentId: student.id,
      stars,
      comment
    });

    res.status(201).json({ message: 'Calificación registrada', rating });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getRatings = async (req: AuthRequest, res: Response) => {
  try {
    const ratings = await Rating.findAll({
      include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'lastName'] }] }],
      order: [['createdAt', 'DESC']]
    });

    const totalStars = ratings.reduce((sum, r) => sum + r.stars, 0);
    const averageRating = ratings.length > 0 ? (totalStars / ratings.length).toFixed(1) : 0;

    res.json({
      ratings,
      averageRating: Number(averageRating),
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getAverageRating = async (req: AuthRequest, res: Response) => {
  try {
    const ratings = await Rating.findAll();
    const totalStars = ratings.reduce((sum, r) => sum + r.stars, 0);
    const average = ratings.length > 0 ? totalStars / ratings.length : 0;

    res.json({
      averageRating: Number(average.toFixed(1)),
      totalRatings: ratings.length,
      starsDistribution: {
        5: ratings.filter(r => r.stars === 5).length,
        4: ratings.filter(r => r.stars === 4).length,
        3: ratings.filter(r => r.stars === 3).length,
        2: ratings.filter(r => r.stars === 2).length,
        1: ratings.filter(r => r.stars === 1).length
      }
    });
  } catch (error) {
    console.error('Get average rating error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
