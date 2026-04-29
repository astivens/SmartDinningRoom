import { Request, Response } from 'express';
import { Cycle } from '../models';

export const createCycle = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate and endDate are required.' });
    }

    const newCycle = await Cycle.create({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'Activo'
    });

    res.status(201).json(newCycle);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'A cycle with this name already exists.' });
    }
    console.error('Error creating cycle:', error);
    res.status(500).json({ message: 'Error creating cycle.' });
  }
};

export const getAllCycles = async (_req: Request, res: Response) => {
  try {
    const cycles = await Cycle.findAll({
      order: [['startDate', 'DESC']]
    });
    res.json(cycles);
  } catch (error) {
    console.error('Error getting cycles:', error);
    res.status(500).json({ message: 'Error getting cycles.' });
  }
};

export const getCycleById = async (req: Request, res: Response) => {
  try {
    const cycle = await Cycle.findByPk(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found.' });
    }
    res.json(cycle);
  } catch (error) {
    console.error('Error getting cycle:', error);
    res.status(500).json({ message: 'Error getting cycle.' });
  }
};

export const closeCycle = async (req: Request, res: Response) => {
  try {
    const cycle = await Cycle.findByPk(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found.' });
    }

    cycle.status = 'Cerrado';
    await cycle.save();

    res.json(cycle);
  } catch (error) {
    console.error('Error closing cycle:', error);
    res.status(500).json({ message: 'Error closing cycle.' });
  }
};
