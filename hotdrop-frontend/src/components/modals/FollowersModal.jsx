import UserListModal from "./UserListModal";

function FollowersModal({ isOpen, onClose, userId, followersList, onFollowStatusChange }) {
  return (
    <UserListModal
      isOpen={isOpen}
      onClose={onClose}
      userId={userId}
      type="followers"
      initialList={followersList}
      onFollowStatusChange={onFollowStatusChange}
    />
  );
}

export default FollowersModal;
