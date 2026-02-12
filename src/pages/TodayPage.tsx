
import React from 'react';
import DayDetailPage from './DayDetailPage';
import { IonPage } from '@ionic/react';
import { Redirect, Route } from 'react-router';

const TodayPage: React.FC = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // We can just redirect to the day detail route for today
    // OR we can render DayDetailPage directly with a dummy route parameter,
    // but better to just use the component if we refactor it to accept prop vs param.
    // Given current implementation triggers off useParams, redirection is cleanest 
    // without refactoring DayDetailPage to be prop-driven.

    return <Redirect to={`/day/${todayStr}`} />;
};

export default TodayPage;
