import { User } from '../components/UserManagement/UserTableRow';

// Genera 100 utenti mock
export const MOCK_USERS: User[] = Array.from({ length: 100 }, (_, i) => {
  const roles = ['Administrator', 'Manager', 'Pharmacy', 'Supplier'];
  const statuses = ['Active', 'Inactive'];
  const firstNames = ['Marco', 'Laura', 'Giuseppe', 'Elena', 'Paolo', 'Anna', 'Luca', 'Sara', 'Francesco', 'Giulia'];
  const lastNames = ['Rossi', 'Bianchi', 'Verdi', 'Ferrari', 'Colombo', 'Russo', 'Romano', 'Gallo', 'Costa', 'Fontana'];
  const entities = ['Farmacia San Marco', 'Farmacia Centrale', 'MediFarma Supplies', 'PharmaTech Solutions', 'Farmacia Rossi', 'Farmacia Milano', 'Farmacia Roma', 'Farmacia Napoli', 'Farmacia Torino', 'Farmacia Firenze'];

  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const role = roles[i % roles.length] as User['role'];
  const status = statuses[i % statuses.length] as User['status'];
  const associatedEntity = entities[i % entities.length];
  const email = `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
  const lastLogin = `May ${Math.max(1, 30 - (i % 30))}, 2025 - ${String(8 + (i % 12)).padStart(2, '0')}:${String(10 + (i % 50)).padStart(2, '0')}`;

  return {
    id: (i + 1).toString(),
    firstName,
    lastName,
    email,
    role,
    associatedEntity,
    status,
    lastLogin
  };
}); 