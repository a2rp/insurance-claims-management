import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Loading from "./components/loading";

const ClaimsQueuePage = lazy(() => import("./pages/claimsQueue/index.jsx"));
const NewClaimPage = lazy(() => import("./pages/newClaim/index.jsx"));
const ClaimDetailsPage = lazy(() => import("./pages/claimDetails/index.jsx"));
const PaymentsPage = lazy(() => import("./pages/payments/index.jsx"));
const ReportsPage = lazy(() => import("./pages/reports/index.jsx"));
const NotFoundPage = lazy(() => import("./pages/notFound/index.jsx"));

const AppRoutes = ({ app }) => {
  const location = useLocation();

  return (
    <Suspense fallback={<Loading />} key={location.pathname}>
      <Routes location={location}>
        <Route element={<ClaimsQueuePage {...app} />} path="/" />
        <Route element={<NewClaimPage {...app} />} path="/new-claim" />
        <Route element={<ClaimDetailsPage {...app} />} path="/claims/:claimId" />
        <Route element={<PaymentsPage {...app} />} path="/payments" />
        <Route element={<ReportsPage {...app} />} path="/reports" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
