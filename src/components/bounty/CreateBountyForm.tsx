import React, { useState } from 'react';
import { useBounty } from '@/hooks/use-bounty';
import { useHiveWallet } from '@/hooks/use-hive-wallet';

export const CreateBountyForm = () => {
  const { connected } = useHiveWallet();
  const { createBounty } = useBounty();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    prizePool: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      alert('Please connect your Hive wallet first');
      return;
    }

    try {
      const result = await createBounty(formData);
      if (result.success) {
        alert('Bounty created successfully!');
        // Reset form or redirect
      }
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert('Failed to create bounty');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Bounty Title"
        value={formData.title}
        onChange={e => setFormData({...formData, title: e.target.value})}
      />
      <input
        type="text"
        placeholder="GitHub Repository Link"
        value={formData.githubLink}
        onChange={e => setFormData({...formData, githubLink: e.target.value})}
      />
      <input
        type="number"
        placeholder="Prize Pool (HIVE)"
        value={formData.prizePool}
        onChange={e => setFormData({...formData, prizePool: Number(e.target.value)})}
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={e => setFormData({...formData, description: e.target.value})}
      />
      <button type="submit">Create Bounty</button>
    </form>
  );
};





// import { BountyContract } from '@/contracts/bounty.contract';
// import { useHiveWallet } from '@/hooks/use-hive-wallet';
// import { notify } from '@/utils/notifications';

// export const CreateBountyForm = () => {
//   const { username } = useHiveWallet();
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (data: any) => {
//     if (!username) {
//       notify.error('Please connect your wallet first');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const bountyContract = new BountyContract(username);
//       const result = await bountyContract.createBountyEscrow({
//         title: data.title,
//         description: data.description,
//         githubLink: data.githubLink,
//         prizePool: parseFloat(data.prizePool)
//       });

//       if (result.success) {
//         notify.success('Bounty created successfully!');
//         // Redirect to bounty page
//       } else {
//         notify.error(result.message);
//       }
//     } catch (error: any) {
//       notify.error(error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // ... rest of your component
// };