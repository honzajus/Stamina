import { useNavigate, useParams } from "react-router-dom";
import { PlainLayout } from "../components/Layout";
import { TopBar } from "../components/TopBar";
import { ProfileContent } from "../components/ProfileContent";

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <PlainLayout>
      <div className="screen">
        <TopBar onBack={() => navigate(-1)} />
        <ProfileContent userId={id} isSelf={false} />
      </div>
    </PlainLayout>
  );
}
