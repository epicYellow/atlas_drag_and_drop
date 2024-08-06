import { quoteItems } from "../tempData/data";
import { Charges, ColumnMap } from "../types/boardTypes";

const mapItemsForColumn = (type: Charges) => {
  return quoteItems.filter((quoteItem) => quoteItem.type === type);
};

function getInitialData() {
  const columnMap: ColumnMap = {
    OriginCharges: {
      title: "OriginCharges",
      columnId: "OriginCharges",
      items: mapItemsForColumn("OriginCharges"),
    },
    FreightCharges: {
      title: "FreightCharges",
      columnId: "FreightCharges",
      items: mapItemsForColumn("FreightCharges"),
    },
    DestinationCharges: {
      title: "DestinationCharges",
      columnId: "DestinationCharges",
      items: mapItemsForColumn("DestinationCharges"),
    },
    BrokerageCharges: {
      title: "BrokerageCharges",
      columnId: "BrokerageCharges",
      items: mapItemsForColumn("BrokerageCharges"),
    },
  };

  const orderedColumnIds = [
    "OriginCharges",
    "FreightCharges",
    "DestinationCharges",
    "BrokerageCharges",
  ];

  return { columnMap, orderedColumnIds };
}

export { getInitialData };
