import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User, UserRole } from './User';
import { generateUid } from '../utils/uidGenerator';

export interface StudentAttributes {
  id: string;
  uid: string;
  userId: string;
  cedula: string;
  carrera: string;
  semestre: number;
  categoriaSisben: string;
  archivoSisben: string;
  cedulaFrontalPath?: string;
  horarioPdfPath?: string;
  direccion?: string;
  barrio: string;
  telefono: string;
  trabaja: boolean;
  trabajaEstudia: boolean;
  estudiaSolo: boolean;
  etnia: string;
  desplazado: boolean;
  trabajadorUniversitario: boolean;
  diasComedor: string[];
  qrCode?: string;
  qrCodeSecret?: string;
  reciboPagoPath?: string;
  isValidatedSisben: boolean;
  sisbenAutoValidated: boolean;
  sisbenValidationDetails?: Record<string, unknown>;
  currentCycle: string;
  cycleRevalidationDueAt?: Date;
  cycleDisabledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentCreationAttributes extends Optional<
  StudentAttributes,
  'id' | 'uid'
  | 'isValidatedSisben'
  | 'cedulaFrontalPath'
  | 'horarioPdfPath'
  | 'direccion'
  | 'trabaja'
  | 'trabajaEstudia'
  | 'estudiaSolo'
  | 'desplazado'
  | 'trabajadorUniversitario'
  | 'diasComedor'
  | 'qrCode'
  | 'qrCodeSecret'
  | 'reciboPagoPath'
  | 'sisbenAutoValidated'
  | 'sisbenValidationDetails'
  | 'currentCycle'
  | 'cycleRevalidationDueAt'
  | 'cycleDisabledAt'
> {}

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  declare id: string;
  declare uid: string;
  declare userId: string;
  declare cedula: string;
  declare carrera: string;
  declare semestre: number;
  declare categoriaSisben: string;
  declare archivoSisben: string;
  declare cedulaFrontalPath?: string;
  declare horarioPdfPath?: string;
  declare direccion?: string;
  declare barrio: string;
  declare telefono: string;
  declare trabaja: boolean;
  declare trabajaEstudia: boolean;
  declare estudiaSolo: boolean;
  declare etnia: string;
  declare desplazado: boolean;
  declare trabajadorUniversitario: boolean;
  declare diasComedor: string[];
  declare qrCode?: string;
  declare qrCodeSecret?: string;
  declare reciboPagoPath?: string;
  declare isValidatedSisben: boolean;
  declare sisbenAutoValidated: boolean;
  declare sisbenValidationDetails?: Record<string, unknown>;
  declare currentCycle: string;
  declare cycleRevalidationDueAt?: Date;
  declare cycleDisabledAt?: Date;
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
    uid: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
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
    cedulaFrontalPath: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    horarioPdfPath: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    trabajaEstudia: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    estudiaSolo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    reciboPagoPath: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isValidatedSisben: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sisbenAutoValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sisbenValidationDetails: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    currentCycle: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '2026-1',
      references: {
        model: 'cycles',
        key: 'name'
      }
    },
    cycleRevalidationDueAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cycleDisabledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    hooks: {
      beforeValidate: (student: Student) => {
        student.uid = generateUid('STD');
      }
    }
  }
);

User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Student;
