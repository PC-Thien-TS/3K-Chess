import { motion } from 'motion/react';

const pieces = [
  {
    piece: "General",
    quantity: 1,
    movement: "Moves one orthogonal step inside the palace.",
    role: "The kingdom’s leader. If checkmated, the faction is eliminated."
  },
  {
    piece: "Advisor",
    quantity: 2,
    movement: "Moves one diagonal step inside the palace.",
    role: "Protects the General and controls palace diagonals."
  },
  {
    piece: "Elephant",
    quantity: 2,
    movement: "Moves two diagonal steps and cannot jump over a blocking piece.",
    role: "Defensive blocker and territory protector."
  },
  {
    piece: "Chariot",
    quantity: 2,
    movement: "Moves orthogonally any distance without jumping.",
    role: "Powerful long-range attacker."
  },
  {
    piece: "Horse",
    quantity: 2,
    movement: "Moves in an L shape and can be blocked by the horse-leg point.",
    role: "Flexible tactical attacker."
  },
  {
    piece: "Cannon",
    quantity: 2,
    movement: "Moves like a Chariot. To capture, it must jump exactly one screen piece.",
    role: "Creates pressure, tactics, and check threats."
  },
  {
    piece: "Soldier",
    quantity: 5,
    movement: "Moves forward before crossing the river; after crossing, moves forward or sideways. Never moves backward.",
    role: "Frontline pressure and late-game control."
  }
];

export default function PieceGuideSection() {
  return (
    <section id="piece-guide" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 uppercase tracking-widest">PIECE GUIDE</h2>
        <p className="text-gold font-medium uppercase tracking-[0.2em] text-sm italic">
          Each kingdom commands a standard 16-piece Xiangqi-style army.
        </p>
      </div>

      <div className="overflow-hidden glass-dark border border-white/5 rounded-[40px]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                <th className="py-8 pl-10">Piece</th>
                <th className="py-8 text-center">Qty</th>
                <th className="py-8">Movement</th>
                <th className="py-8 pr-10">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pieces.map((p, i) => (
                <tr key={i} className="group hover:bg-white/2 transition-colors">
                  <td className="py-8 pl-10">
                    <span className="text-white font-serif font-bold text-xl tracking-wider group-hover:text-gold transition-colors">{p.piece}</span>
                  </td>
                  <td className="py-8 text-center">
                    <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gold mx-auto">
                      {p.quantity}
                    </span>
                  </td>
                  <td className="py-8 font-medium text-zinc-300 text-sm max-w-xs">{p.movement}</td>
                  <td className="py-8 pr-10 text-zinc-500 text-xs italic leading-relaxed">{p.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden divide-y divide-white/5">
          {pieces.map((p, i) => (
            <div key={i} className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-2xl font-serif font-bold text-white tracking-wider">{p.piece}</h4>
                <div className="px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-[10px] font-bold text-gold uppercase tracking-tighter">
                  x{p.quantity}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Movement</div>
                  <p className="text-zinc-300 text-sm">{p.movement}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Role</div>
                  <p className="text-zinc-500 text-xs italic">{p.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
