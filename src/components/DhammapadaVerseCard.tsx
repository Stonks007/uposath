import React from 'react';
import { IonButton, IonIcon, IonLabel } from '@ionic/react';
import { refreshCircle } from 'ionicons/icons';
import { DhammapadaVerse, getCleanVerseText, getVerseDisplayReference } from '../services/dhammapadaService';
import './DhammapadaVerseCard.css';

interface Props {
  verse: DhammapadaVerse;
  isPrimaryForDay?: boolean;
  onShowAnother?: () => void;
}

const DhammapadaVerseCard: React.FC<Props> = ({ verse, isPrimaryForDay = false, onShowAnother }) => {
  const reference = getVerseDisplayReference(verse);
  const text = getCleanVerseText(verse);

  return (
    <div className="dhamma-card">
      <div className="dhamma-card__halo" />
      <div className="dhamma-card__header">
        <div className="dhamma-card__title">
          <span className="dhamma-card__eyebrow">Dhammapada</span>
          <h3 className="dhamma-card__heading">
            {verse.chapterTitle}
          </h3>
        </div>
        <div className="dhamma-card__reference">
          <span className="dhamma-card__reference-label">{reference}</span>
          {isPrimaryForDay && (
            <span className="dhamma-card__badge">Verse of the Day</span>
          )}
        </div>
      </div>

      <p className="dhamma-card__text">
        {text}
      </p>

      {onShowAnother && (
        <div className="dhamma-card__actions">
          <IonButton
            size="small"
            fill="clear"
            onClick={onShowAnother}
            className="dhamma-card__button premium-button premium-button--accent"
          >
            <IonIcon slot="start" icon={refreshCircle} />
            <IonLabel className="dhamma-card__button-label">Show another verse</IonLabel>
          </IonButton>
        </div>
      )}
    </div>
  );
};

export default DhammapadaVerseCard;

