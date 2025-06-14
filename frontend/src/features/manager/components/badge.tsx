import React from 'react';
import styled from 'styled-components';

// Styled components pour le badge
const BadgeContainer = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const BadgeShape = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c00, #ffcc00);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  z-index: 1;
`;

const BadgeContent = styled.div`
  position: relative;
  width: 80%;
  height: 80%;
  background: #fff;
  border-radius: 50%;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const Ribbon = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 20%;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-radius: 10px;
  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
  z-index: 2;
`;

const Stars = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCAxMCAxMCIgd2lkdGg9IjEwcHgiIGhlaWdodD0iMTBweCIgdmVyc2lvbj0iMS4xIj48cGF0aCBkPSJNNSwwQzEuNywwLDAuNywxLjcsMCw1QzAsOS4zLDEuNywxMCw1LDEwQzkuMywxMCwxMCw5LjMsMTAsNVMyLjcsMCw1LDB6IiBmaWxsPSIjZmZmIi8+PC9zdmc+');
  background-size: cover;
  z-index: 3;
`;

interface BadgeProps {
  rank: number;
}

const RankBadge: React.FC<BadgeProps> = ({ rank }) => {
  return (
    <BadgeContainer>
      <BadgeShape />
      <BadgeContent>{rank}</BadgeContent>
      <Ribbon />
      <Stars />
    </BadgeContainer>
  );
};

export default RankBadge;