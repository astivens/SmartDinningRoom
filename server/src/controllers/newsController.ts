import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { News } from '../models';

export const getNews = async (req: AuthRequest, res: Response) => {
  try {
    const news = await News.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getNewsById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json(news);
  } catch (error) {
    console.error('Get news by id error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const createNews = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, imageUrl } = req.body;

    const news = await News.create({
      title,
      content,
      imageUrl,
      isActive: true
    });

    res.status(201).json({ message: 'Noticia creada', news });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateNews = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrl, isActive } = req.body;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    await news.update({ title, content, imageUrl, isActive });

    res.json({ message: 'Noticia actualizada', news });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const deleteNews = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    await news.update({ isActive: false });

    res.json({ message: 'Noticia eliminada' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
