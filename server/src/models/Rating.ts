import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Student } from './Student';
import { generateUid } from '../utils/uidGenerator';

export interface RatingAttributes {
  id: string;
  uid: string;
  studentId: string;
  stars: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RatingCreationAttributes extends Optional<RatingAttributes, 'id' | 'uid' | 'comment'> {}

export class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  declare id: string;
  declare uid: string;
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
    uid: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
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
    tableName: 'ratings',
    hooks: {
      beforeValidate: (rating: Rating) => {
        rating.uid = generateUid('RTG');
      }
    }
  }
);

Student.hasMany(Rating, { foreignKey: 'studentId', as: 'ratings' });
Rating.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

export default Rating;
