export default function AnnouncementBar() {
  return (
    <div className="h-9 overflow-hidden bg-olive text-sand">
      <div className="marquee-track">
        {[0, 1].map((group) => (
          <div aria-hidden={group === 1} className="marquee-group" key={group}>
            <span>Complimentary delivery in Bujumbura on orders over 200,000 BIF</span>
            <span className="text-gold">◆</span>
            <span>Returns and exchanges within 24 hours</span>
            <span className="text-gold">◆</span>
            <span>Made for what’s next</span>
            <span className="text-gold">◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
