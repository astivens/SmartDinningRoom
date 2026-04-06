import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User, UserRole } from './User';

export interface StudentAttributes {
  id: string;
  userId: string;
  cedula: string;
  carrera: string;
  semestre: number;
  categoriaSisben: string;
  archivoSisben: string;
  direccion?: string;
  barrio: string;
  telefono: string;
  trabaja: boolean;
  etnia: string;
  desplazado: boolean;
  trabajadorUniversitario: boolean;
  diasComedor: string[];
  qrCode?: string;
  qrCodeSecret?: string;
  isValidatedSisben: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'isValidatedSisben'> {}

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  declare id: string;
  declare userId: string;
  declare cedula: string;
  declare carrera: string;
  declare semestre: number;
  declare categoriaSisben: string;
  declare archivoSisben: string;
  declare direccion?: string;
  declare barrio: string;
  declare telefono: string;
  declare trabaja: boolean;
  declare etnia: string;
  declare desplazado: boolean;
  declare trabajadorUniversitario: boolean;
  declare diasComedor: string[];
  declare qrCode?: string;
  declare qrCodeSecret?: string;
  declare isValidatedSisben: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cedula: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      validate: {
        len: [6, 12],
        isNumeric: true
      }
    },
    carrera: {
      type: DataTypes.STRING(25),
      allowNull: false,
      validate: {
        len: [1, 25]
      }
    },
    semestre: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    categoriaSisben: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    archivoSisben: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    direccion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    barrio: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    trabaja: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    etnia: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    desplazado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    trabajadorUniversitario: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    diasComedor: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qrCodeSecret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isValidatedSisben: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students'
  }
);

User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Student;
