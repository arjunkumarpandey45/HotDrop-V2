import UserListModal from "./UserListModal";

function FollowingModal({
  isOpen,
  onClose,
  userId,
  followingList,
  onFollowStatusChange,
  onUnfollowSuccess,
}) {
  return (
    <UserListModal
      isOpen={isOpen}
      onClose={onClose}
      userId={userId}
      type="following"
      initialList={followingList}
      onFollowStatusChange={onFollowStatusChange}
      onUnfollowSuccess={onUnfollowSuccess}
    />
  );
}

export default FollowingModal;
