import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RatingAttributes {
  id: string;
  studentId: string;
  stars: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RatingCreationAttributes extends Optional<RatingAttributes, 'id' | 'comment'> {}

export class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  declare id: string;
  declare studentId: string;
  declare stars: number;
  declare comment?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Rating.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Rating',
    tableName: 'ratings'
  }
);

export default Rating;
