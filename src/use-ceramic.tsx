import React, { useContext } from "react";
import { AllowedNetwork, CeramicService } from "./ceramic-service";

export const CeramicContext = React.createContext<CeramicService | null>(null);

export type CeramicProviderProps =
  | {
      network: AllowedNetwork;
      endpoint?: string;
      render?: (ceramic: CeramicService) => React.ReactElement;
    }
  | {
      service: CeramicService;
      render?: (ceramic: CeramicService) => React.ReactElement;
    };

export function CeramicProvider(
  props: React.PropsWithChildren<CeramicProviderProps>
) {
  const service =
    props.service || new CeramicService(props.network, props.endpoint);
  const renderBody = () => {
    if (props.render) {
      return props.render(service);
    } else {
      return props.children;
    }
  };
  return (
    <CeramicContext.Provider value={service}>
      {renderBody()}
    </CeramicContext.Provider>
  );
}

export function useCeramic(): CeramicService {
  const service = useContext(CeramicContext);
  if (service) {
    return service;
  } else {
    throw new Error(`Please wrap with CeramicProvider`);
  }
}
