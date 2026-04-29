import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Student } from './Student';

export interface CycleAttributes {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'Activo' | 'Cerrado';
  createdAt?: Date;
  updatedAt?: Date;
}

interface CycleCreationAttributes extends Optional<
  CycleAttributes,
  'id' | 'status'
> {}

export class Cycle extends Model<CycleAttributes, CycleCreationAttributes> implements CycleAttributes {
  declare id: string;
  declare name: string;
  declare startDate: Date;
  declare endDate: Date;
  declare status: 'Activo' | 'Cerrado';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Cycle.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Activo', 'Cerrado'),
      defaultValue: 'Activo',
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Cycle',
    tableName: 'cycles'
  }
);

// Associations
Cycle.hasMany(Student, {
  foreignKey: 'currentCycle',
  sourceKey: 'name',
  as: 'students'
});
Student.belongsTo(Cycle, {
  foreignKey: 'currentCycle',
  targetKey: 'name',
  as: 'cycle'
});

export default Cycle;
