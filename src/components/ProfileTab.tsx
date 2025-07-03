import { Army } from '../types/army';

interface ProfileTabProps {
  army: Army | null;
}

export default function ProfileTab({ army }: ProfileTabProps) {
  return (
    <section className="mx-4">
      <h2 className="text-2xl font-bold uppercase mb-4">Profile</h2>
      <p className="text-gray-400">User profile and settings go here.</p>
    </section>
  );
}
